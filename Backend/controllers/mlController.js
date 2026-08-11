import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import axios from "axios";
import { hybridMatch } from "../utils/hybridMatcher.js";
import { getPythonMatcher } from "../utils/pythonMatcher.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ML_SERVICE_URL = process.env.ML_HOST || "http://127.0.0.1:5001";
const CV_CLASSIFIER_URL =
  process.env.CV_CLASSIFIER_URL || "http://127.0.0.1:5002";
const SKILL_MATCHER_URL_DEFAULT = process.env.SKILL_MATCHER_URL || "http://127.0.0.1:5003";
const CHAT_MODEL_URL = process.env.CHAT_MODEL_URL || "http://127.0.0.1:5004";
const USE_PYTHON_MATCHER = process.env.USE_PYTHON_MATCHER !== "false"; // Default: true (Python BERT matcher)

// Python service - using Model 1 (CV-Job Matcher) for BERT matching
let pythonServiceReady = false;
const pythonMatcher = getPythonMatcher();

pythonMatcher
  .start()
  .then(() => {
    pythonServiceReady = true;
    console.log("✅ Python BERT Matcher Service started successfully!");
  })
  .catch((error) => {
    pythonServiceReady = false;
    console.error("❌ Failed to start Python service:", error.message);
    console.log("⚠️  Will fallback to JavaScript matcher");
  });

export const matchCV = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "cvFile is required" });
    }
    return res
      .status(501)
      .json({ success: false, message: "ML integration disabled" });
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { success: false, error: err.message };
    return res.status(status).json(data);
  }
};

export const matchJobs = async (req, res) => {
  try {
    console.log("🎯 Matching jobs for user:", req.user.email);

    // Get candidate's CV text
    const candidate = await Candidate.findOne({ email: req.user.email });
    if (
      !candidate ||
      !candidate.resumeText ||
      candidate.resumeText.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "No CV found. Please upload your CV first.",
      });
    }

    const cvText = candidate.resumeText;
    console.log("📄 CV Text Length:", cvText.length, "characters");
    console.log("📄 CV Preview:", cvText.substring(0, 100) + "...");

    // Fetch active jobs to match against
    const jobs = await Job.find({ status: "Active" });
    if (!jobs || jobs.length === 0) {
      return res.status(422).json({
        success: false,
        message: "No jobs available",
      });
    }

    console.log(`💼 Found ${jobs.length} active jobs to match`);

    // Use Python matcher with BERT embeddings (same as test_my_cv.py)
    if (USE_PYTHON_MATCHER && pythonServiceReady) {
      try {
        console.log(
          "🐍 Using Persistent Python BERT Matcher (70% Semantic BERT + 30% Keywords)"
        );

        // Prepare job descriptions (description field only!)
        const jobDescriptions = jobs.map((job) => job.description || "");

        // Call persistent Python service (model already loaded in memory!)
        const matches = await pythonMatcher.match(cvText, jobDescriptions, 10);

        // Map results back to full job objects
        const jobsWithScores = matches.map((match) => ({
          ...jobs[match.job_index].toObject(),
          matchScore: Math.round(match.similarity_score * 100) / 100,
        }));

        console.log(
          `✅ Python BERT Matcher returned ${jobsWithScores.length} matches`
        );
        jobsWithScores.slice(0, 5).forEach((job, idx) => {
          console.log(`   ${idx + 1}. "${job.title}": ${job.matchScore}%`);
        });

        return res.status(200).json({
          success: true,
          data: jobsWithScores,
          method: "python_bert_hybrid_persistent",
          note: "Using BERT embeddings + keyword matching (same as test_my_cv.py) - Fast persistent service!",
        });
      } catch (pythonError) {
        console.error("❌ Python matcher failed:", pythonError.message);
        console.log("⚠️  Falling back to JavaScript hybrid matcher...");
        // Fall through to JavaScript matcher
      }
    } else if (USE_PYTHON_MATCHER && !pythonServiceReady) {
      console.log("⚠️  Python service not ready, using JavaScript fallback");
    }

    // Fallback: Use JavaScript Hybrid Matcher
    console.log(
      "🚀 Using JavaScript Hybrid Matcher (token-based semantic + keywords)"
    );
    const matches = hybridMatch(cvText, jobs, 10);

    const jobsWithScores = matches.map((match) => ({
      ...match.job.toObject(),
      matchScore: match.matchScore,
    }));

    console.log(`✅ Returning ${jobsWithScores.length} jobs with match scores`);

    return res.status(200).json({
      success: true,
      data: jobsWithScores,
      method: "javascript_hybrid",
      note: "Token-based matching (fallback mode)",
    });
  } catch (err) {
    console.error("❌ Error in matchJobs:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const getMatchInputs = async (req, res) => {
  try {
    const email = (req.query?.email || "").trim().toLowerCase();
    let candidate = null;
    if (email) {
      candidate = await Candidate.findOne({ email });
    } else {
      candidate = await Candidate.findOne({
        resumeText: { $exists: true, $ne: "" },
      }).sort({ createdAt: -1 });
    }
    if (
      !candidate ||
      !candidate.resumeText ||
      candidate.resumeText.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "No candidate resumeText found. Provide ?email=",
      });
    }

    const cvText = candidate.resumeText;
    const text = (cvText || "").toLowerCase();
    const normalize = (s) =>
      s
        .toLowerCase()
        .replace(/\+/g, "p")
        .replace(/#/g, "sharp")
        .replace(/node\.?\s*js/g, "nodejs");
    const tokenize = (s) =>
      normalize(s)
        .replace(/[^a-z0-9\s]+/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    const stop = new Set([
      "the",
      "and",
      "for",
      "with",
      "from",
      "into",
      "that",
      "this",
      "will",
      "shall",
      "have",
      "has",
      "are",
      "was",
      "were",
      "to",
      "in",
      "on",
      "of",
      "a",
      "an",
      "by",
      "at",
      "as",
      "or",
      "your",
      "you",
      "we",
      "our",
    ]);
    const filterTokens = (arr) =>
      arr.filter((w) => !stop.has(w) && w.length > 2);
    const makeBigrams = (arr) =>
      arr
        .slice(0, Math.max(0, arr.length - 1))
        .map((_, i) => `${arr[i]} ${arr[i + 1]}`);
    const stem = (w) => w.replace(/(ing|ed|s)$/, "");
    const cvTokensRaw = tokenize(text);
    const cvTokens = filterTokens(cvTokensRaw).map(stem);
    const cvBigrams = makeBigrams(cvTokens);

    const jobs = await Job.find({ status: "Active" });
    if (!jobs || jobs.length === 0) {
      return res
        .status(422)
        .json({ success: false, message: "No jobs available" });
    }
    const limit = Math.min(parseInt(req.query?.limit || "10"), 50);
    const jobsPayload = jobs.slice(0, limit).map((job) => {
      const jobText = (job.description || "").toLowerCase();
      const jobTokensRaw = tokenize(jobText);
      const jobTokens = filterTokens(jobTokensRaw).map(stem);
      const jobBigrams = makeBigrams(jobTokens);
      return {
        jobId: job._id?.toString?.() || job.id || "unknown",
        title: job.title || "",
        descLen: jobText.length,
        tokenCount: jobTokens.length,
        bigramCount: jobBigrams.length,
        sampleTokens: jobTokens.slice(0, 30),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        candidateEmail: candidate.email,
        cv: {
          textLength: cvText.length,
          tokenCount: cvTokens.length,
          bigramCount: cvBigrams.length,
          sampleTokens: cvTokens.slice(0, 30),
          preview: cvText.substring(0, 100),
        },
        jobs: jobsPayload,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Chat endpoint to power frontend chatbot (employee interview page)
 * POST /api/ml/chat
 * Body: { question: string, context?: string }
 * Uses GROQ API if `GROQ_API_KEY` is set, otherwise proxies to ML_SERVICE_URL `/chat`.
 */
export const chatModel = async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question || question.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "question is required" });
    }

    // Prefer using Groq API when API key is available
    if (process.env.GROQ_API_KEY) {
      const GROQ_API_URL =
        process.env.GROQ_API_URL ||
        "https://api.groq.com/openai/v1/chat/completions";
      const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

      const payload = {
        model,
        messages: [
          {
            role: "system",
            content:
              context ||
              "You are a professional career assistant chatbot. Use only the provided CV content when answering.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      };

      console.log("🤖 Calling Groq API:", GROQ_API_URL);
      console.log("📝 Model:", model);
      console.log("❓ Question:", question.substring(0, 100));

      const response = await axios.post(GROQ_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });

      const answer =
        response.data?.choices?.[0]?.message?.content ||
        response.data?.output ||
        response.data?.text ||
        JSON.stringify(response.data);

      console.log("✅ Groq API response received");
      return res.status(200).json({ success: true, answer });
    }

    // Fallback: ask the configured ML service (if it exposes a /chat proxy)
    const resp = await axios.post(
      `${ML_SERVICE_URL}/chat`,
      { question, context },
      { timeout: 60000 }
    );
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error("❌ chatModel error:", err?.message || err);
    if (err.response) {
      console.error("📋 Response status:", err.response.status);
      console.error(
        "📋 Response data:",
        JSON.stringify(err.response.data, null, 2)
      );
    }
    const status = err.response?.status || 500;
    const data = err.response?.data || { success: false, error: err.message };
    return res.status(status).json(data);
  }
};

/**
 * Match CVs to Job Description (for HR)
 * Finds best matching candidate CVs for a given job description
 * Uses the SAME matching logic as Employee matching for consistent scores
 */
export const matchCVsToJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId is required",
      });
    }

    console.log("🎯 HR: Finding matching CVs for job:", jobId);

    // Get the job description
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const jobDescription = job.description || "";
    if (!jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is empty",
      });
    }

    // Get all candidates with CV text
    const candidates = await Candidate.find({
      resumeText: { $exists: true, $ne: "" },
    });

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No CVs found in database",
      });
    }

    console.log(`📄 Found ${candidates.length} candidates with CVs`);

    // Use hybridMatchCVsToJob - same matching logic as Employee (hybridMatch)
    const { hybridMatchCVsToJob } = await import("../utils/hybridMatcher.js");

    const topMatches = hybridMatchCVsToJob(jobDescription, candidates, 10);

    // Map results to expected format
    const matchedCandidates = topMatches.map((match) => ({
      _id: match.candidate._id,
      name: match.candidate.name,
      email: match.candidate.email,
      phone: match.candidate.phone,
      skills: match.candidate.skills,
      experience: match.candidate.experience,
      education: match.candidate.education,
      matchScore: match.matchScore,
      matchedSkills: match.matchResult?.matched || [],
      missingSkills: match.matchResult?.missing || [],
      resumeText: match.candidate.resumeText.substring(0, 300) + "...",
    }));

    console.log(`✅ Matched ${matchedCandidates.length} candidates to job`);
    matchedCandidates.slice(0, 5).forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.name}: ${c.matchScore}%`);
    });

    return res.status(200).json({
      success: true,
      data: matchedCandidates,
      jobTitle: job.title,
      method: "Hybrid Skill Matching (same as Employee)",
    });
  } catch (error) {
    console.error("❌ Error matching CVs to job:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Classify CV to determine job title/role
 * Uses cv_classifier_merged.keras model + Groq API
 */
export const classifyCV = async (req, res) => {
  try {
    console.log("🎯 Classifying CV for user:", req.user.email);

    // Get candidate's CV text
    const candidate = await Candidate.findOne({ email: req.user.email });
    if (
      !candidate ||
      !candidate.resumeText ||
      candidate.resumeText.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "No CV found. Please upload your CV first.",
      });
    }

    const cvText = candidate.resumeText;
    console.log("📄 CV Text Length:", cvText.length, "characters");

    // Call CV Classifier Service
    console.log("🔬 Calling CV Classifier Service at:", CV_CLASSIFIER_URL);

    const response = await axios.post(
      `${CV_CLASSIFIER_URL}/classify`,
      {
        cv_text: cvText,
        use_groq_analysis: true,
      },
      {
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (response.data.success) {
      console.log("✅ Classification successful!");
      console.log("   Job Title:", response.data.job_title);
      console.log("   Confidence:", response.data.confidence);
      console.log("   AI Analysis:", response.data.ai_analysis);

      // Update candidate with classified job title AND save classification results
      candidate.jobTitle = response.data.job_title;

      // Save classification results for persistence
      candidate.classificationResult = {
        jobTitle: response.data.job_title,
        confidence: response.data.confidence,
        method: response.data.decision_method,
        classifiedAt: new Date(),
      };

      await candidate.save();
      console.log("💾 Classification results saved to database");

      return res.status(200).json({
        success: true,
        data: {
          jobTitle: response.data.job_title,
          confidence: response.data.confidence,
          decision_method: response.data.decision_method,
          ai_analysis: response.data.ai_analysis,
          keras_prediction: response.data.keras_prediction,
        },
        message: "CV classified successfully!",
      });
    } else {
      throw new Error(response.data.error || "Classification failed");
    }
  } catch (error) {
    console.error("❌ Error classifying CV:", error.message);

    // Check if it's a connection error
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "CV Classifier Service is not running. Please start it first.",
        hint: "Run: python ml-service/cv_classifier_service.py",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Analyze a specific job against user's CV
 * Returns matched and missing skills using TensorFlow model
 */
export const analyzeJobForUser = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userEmail = req.user.email;

    console.log("🎯 Analyzing job", jobId, "for user:", userEmail);

    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Get candidate's CV
    const candidate = await Candidate.findOne({ email: userEmail });
    if (
      !candidate ||
      !candidate.resumeText ||
      candidate.resumeText.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "No CV found. Please upload your CV first.",
      });
    }

    const cvText = candidate.resumeText;
    const jobDescription = job.description || "";

    if (!jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is empty",
      });
    }

    console.log("📄 CV Text Length:", cvText.length);
    console.log("💼 Job Description Length:", jobDescription.length);

    // Call TensorFlow Skill Matcher Service (last-one model)
    try {
      console.log("🤖 Calling TensorFlow Skill Matcher Service...");
      const SKILL_MATCHER_URL = SKILL_MATCHER_URL_DEFAULT;

      const analyzerResponse = await axios.post(
        `${SKILL_MATCHER_URL}/analyze`,
        {
          cv_text: cvText,
          job_desc: jobDescription,
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (analyzerResponse.data.success) {
        const analysisData = analyzerResponse.data.data;

        console.log("✅ TensorFlow Analysis Complete:");
        console.log(`   - Match: ${analysisData.match_percentage}%`);
        console.log(
          `   - Matched Skills: ${analysisData.matched_skills.length}`
        );
        console.log(
          `   - Missing Skills: ${analysisData.missing_skills.length}`
        );

        return res.status(200).json({
          success: true,
          data: {
            jobTitle: job.title,
            company: job.company,
            matchScore: analysisData.match_percentage,
            matchPercentage: analysisData.match_percentage,
            matchedSkills: analysisData.matched_skills,
            missingSkills: analysisData.missing_skills,
            totalJobSkills: analysisData.job_skills.length,
            totalCvSkills: analysisData.cv_skills.length,
            mlService: "tensorflow",
          },
        });
      } else {
        throw new Error("Skill Analyzer returned unsuccessful response");
      }
    } catch (mlError) {
      console.error("❌ TensorFlow Service Error:", mlError.message);

      // Check if it's a connection error
      if (mlError.code === "ECONNREFUSED" || mlError.code === "ENOTFOUND") {
        console.log("⚠️  Skill Matcher Service not running!");
        console.log("💡 Start it with: python start_skill_matcher.py");
      }

      // Fallback: Extract skills from job description using NLP-like approach
      console.log("⚠️  Falling back to basic text analysis...");

      // Common skill keywords to look for in job description
      const skillPatterns = [
        // Programming Languages
        "python",
        "javascript",
        "java",
        "c++",
        "c#",
        "php",
        "ruby",
        "go",
        "rust",
        "swift",
        "kotlin",
        "typescript",
        // Web Technologies
        "react",
        "vue",
        "angular",
        "node.js",
        "express",
        "django",
        "flask",
        "spring",
        "laravel",
        // Databases
        "sql",
        "mysql",
        "postgresql",
        "mongodb",
        "redis",
        "elasticsearch",
        "oracle",
        // Cloud & DevOps
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "jenkins",
        "ci/cd",
        "terraform",
        // Data & ML
        "machine learning",
        "deep learning",
        "tensorflow",
        "pytorch",
        "pandas",
        "numpy",
        "data analysis",
        // Soft Skills
        "communication",
        "leadership",
        "teamwork",
        "problem solving",
        "critical thinking",
        "time management",
        // Business Skills
        "project management",
        "agile",
        "scrum",
        "product management",
        "business analysis",
        // Marketing & PR
        "public relations",
        "media relations",
        "social media",
        "content strategy",
        "seo",
        "marketing",
        "crisis management",
        "brand management",
        "copywriting",
        "analytics",
        // Design
        "ui/ux",
        "photoshop",
        "illustrator",
        "figma",
        "design thinking",
        // Other
        "git",
        "github",
        "api",
        "rest",
        "graphql",
        "microservices",
        "testing",
        "debugging",
      ];

      // Extract skills from job description
      const jobDescLower = jobDescription.toLowerCase();
      const cvTextLower = cvText.toLowerCase();

      const foundJobSkills = skillPatterns.filter((skill) =>
        jobDescLower.includes(skill.toLowerCase())
      );

      // Also include requiredSkills if available
      const requiredSkillsArray = job.requiredSkills || [];
      const allJobSkills = [
        ...new Set([
          ...foundJobSkills,
          ...requiredSkillsArray.map((s) => s.toLowerCase()),
        ]),
      ];

      if (allJobSkills.length === 0) {
        console.warn("⚠️ No skills found in job description");
        return res.status(200).json({
          success: true,
          data: {
            jobTitle: job.title,
            company: job.company,
            matchScore: 0,
            matchPercentage: 0,
            matchedSkills: [],
            missingSkills: [],
            totalJobSkills: 0,
            totalCvSkills: 0,
            fallback: true,
            message:
              "No skills detected in job description. Please add more details.",
          },
        });
      }

      // Check which skills are in CV
      const matchedSkills = [];
      const missingSkillsList = [];

      allJobSkills.forEach((skill) => {
        if (cvTextLower.includes(skill.toLowerCase())) {
          matchedSkills.push(skill);
        } else {
          missingSkillsList.push(skill);
        }
      });

      const matchPercentage =
        allJobSkills.length > 0
          ? (matchedSkills.length / allJobSkills.length) * 100
          : 0;

      const missingSkills = missingSkillsList.map((skill) => ({
        skill,
        confidence: 0.6,
        priority: "MEDIUM",
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          skill + " tutorial"
        )}`,
      }));

      console.log(`✅ Fallback Analysis Complete:`);
      console.log(
        `   - Skills extracted from job description: ${foundJobSkills.length}`
      );
      console.log(`   - Total job skills: ${allJobSkills.length}`);
      console.log(`   - Matched: ${matchedSkills.length}`);
      console.log(`   - Missing: ${missingSkillsList.length}`);
      console.log(`   - Match %: ${matchPercentage.toFixed(1)}%`);

      return res.status(200).json({
        success: true,
        data: {
          jobTitle: job.title,
          company: job.company,
          matchScore: Math.round(matchPercentage * 100) / 100,
          matchPercentage: Math.round(matchPercentage * 100) / 100,
          matchedSkills,
          missingSkills,
          totalJobSkills: allJobSkills.length,
          totalCvSkills: matchedSkills.length,
          fallback: true,
          extractedFrom: "job_description",
        },
      });
    }
  } catch (error) {
    console.error("❌ Error in analyzeJobForUser:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze job",
    });
  }
};
