import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import axios from "axios";
import { hybridMatch } from "../utils/hybridMatcher.js";

// ML Service URLs (configurable via environment variables)
const ML_SERVICE_URL = process.env.ML_HOST || "http://localhost:5001";
const CV_CLASSIFIER_URL = process.env.CV_CLASSIFIER_URL || "http://localhost:5002";
const SKILL_MATCHER_URL = process.env.SKILL_MATCHER_URL || "http://localhost:5003";
const CHAT_MODEL_URL = process.env.CHAT_MODEL_URL || "http://localhost:5004";

// Check if ML service is available
const checkMLServiceHealth = async (url, serviceName) => {
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    return response.data.status === "healthy";
  } catch (error) {
    console.log(`⚠️  ${serviceName} not available at ${url}`);
    return false;
  }
};

/**
 * Match CV with a single file (for CV upload analysis)
 */
export const matchCV = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "cvFile is required" });
    }
    return res.status(501).json({ success: false, message: "ML integration disabled" });
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { success: false, error: err.message };
    return res.status(status).json(data);
  }
};

/**
 * Match jobs for the authenticated user
 * Uses HTTP to call Model 1 (CV-Job Matcher) service
 */
export const matchJobs = async (req, res) => {
  try {
    console.log("🎯 Matching jobs for user:", req.user.email);

    // Get candidate's CV text
    const candidate = await Candidate.findOne({ email: req.user.email });
    if (!candidate || !candidate.resumeText || candidate.resumeText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "No CV found. Please upload your CV first.",
      });
    }

    const cvText = candidate.resumeText;
    console.log("📄 CV Text Length:", cvText.length, "characters");

    // Fetch active jobs to match against
    const jobs = await Job.find({ status: "Active" });
    if (!jobs || jobs.length === 0) {
      return res.status(422).json({
        success: false,
        message: "No jobs available",
      });
    }

    console.log(`💼 Found ${jobs.length} active jobs to match`);

    // Try Model 1 HTTP service first
    const isModel1Available = await checkMLServiceHealth(ML_SERVICE_URL, "Model 1 (CV-Job Matcher)");
    
    if (isModel1Available) {
      try {
        console.log("🤖 Using Model 1 (CV-Job Matcher) via HTTP");

        // Prepare job descriptions
        const jobDescriptions = jobs.map((job, index) => ({
          id: job._id.toString(),
          description: job.description || "",
        }));

        // Call Model 1 HTTP service
        const response = await axios.post(
          `${ML_SERVICE_URL}/match-jobs`,
          {
            cv_text: cvText,
            job_descriptions: jobDescriptions.slice(0, 20), // Limit to 20 jobs
          },
          { timeout: 60000 }
        );

        if (response.data.success && response.data.matches) {
          const matchedJobs = response.data.matches;
          
          // Map results back to full job objects
          const jobsWithScores = matchedJobs.map((match) => {
            const jobIndex = match.job_index;
            if (jobIndex >= 0 && jobIndex < jobs.length) {
              return {
                ...jobs[jobIndex].toObject(),
                matchScore: Math.round(match.similarity_score * 100) / 100,
              };
            }
            return null;
          }).filter(Boolean);

          console.log(`✅ Model 1 returned ${jobsWithScores.length} matches`);
          jobsWithScores.slice(0, 5).forEach((job, idx) => {
            console.log(`   ${idx + 1}. "${job.title}": ${job.matchScore}%`);
          });

          return res.status(200).json({
            success: true,
            data: jobsWithScores,
            method: "model1_http",
            note: "Using BERT embeddings + keyword matching via HTTP service",
          });
        }
      } catch (modelError) {
        console.error("❌ Model 1 HTTP call failed:", modelError.message);
        console.log("⚠️  Falling back to JavaScript hybrid matcher...");
      }
    }

    // Fallback: Use JavaScript Hybrid Matcher
    console.log("🚀 Using JavaScript Hybrid Matcher (token-based semantic + keywords)");
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

/**
 * Get match inputs for debugging
 */
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
    if (!candidate || !candidate.resumeText || candidate.resumeText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "No candidate resumeText found. Provide ?email=",
      });
    }

    const cvText = candidate.resumeText;
    const text = (cvText || "").toLowerCase();
    const normalize = (s) =>
      s.toLowerCase()
        .replace(/\+/g, "p")
        .replace(/#/g, "sharp")
        .replace(/node\.?\s*js/g, "nodejs");
    const tokenize = (s) =>
      normalize(s)
        .replace(/[^a-z0-9\s]+/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    const stop = new Set([
      "the", "and", "for", "with", "from", "into", "that", "this",
      "will", "shall", "have", "has", "are", "was", "were", "to",
      "in", "on", "of", "a", "an", "by", "at", "as", "or", "your",
      "you", "we", "our",
    ]);
    const filterTokens = (arr) => arr.filter((w) => !stop.has(w) && w.length > 2);
    const makeBigrams = (arr) =>
      arr.slice(0, Math.max(0, arr.length - 1))
        .map((_, i) => `${arr[i]} ${arr[i + 1]}`);
    const stem = (w) => w.replace(/(ing|ed|s)$/, "");
    const cvTokensRaw = tokenize(text);
    const cvTokens = filterTokens(cvTokensRaw).map(stem);
    const cvBigrams = makeBigrams(cvTokens);

    const jobs = await Job.find({ status: "Active" });
    if (!jobs || jobs.length === 0) {
      return res.status(422).json({ success: false, message: "No jobs available" });
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
 * Uses GROQ API if `GROQ_API_KEY` is set, otherwise proxies to Model 4 service.
 */
export const chatModel = async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "question is required" });
    }

    // Prefer using Groq API when API key is available
    if (process.env.GROQ_API_KEY) {
      const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
      const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

      const payload = {
        model,
        messages: [
          {
            role: "system",
            content: context || "You are a professional career assistant chatbot. Use only the provided CV content when answering.",
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

    // Fallback: ask Model 4 service
    const isModel4Available = await checkMLServiceHealth(CHAT_MODEL_URL, "Model 4 (Chat)");
    
    if (isModel4Available) {
      const resp = await axios.post(
        `${CHAT_MODEL_URL}/chat`,
        { question, context },
        { timeout: 60000 }
      );
      return res.status(200).json({ success: true, answer: resp.data.answer || resp.data.message });
    }

    // Final fallback: local response
    return res.status(200).json({
      success: true,
      answer: `Thank you for your question: "${question}"\n\nI'm your career assistant chatbot. Please ensure the Chat Model service is running for full functionality.`,
      source: "fallback",
    });
  } catch (err) {
    console.error("❌ chatModel error:", err?.message || err);
    const status = err.response?.status || 500;
    const data = err.response?.data || { success: false, error: err.message };
    return res.status(status).json(data);
  }
};

/**
 * Match CVs to Job Description (for HR)
 * Finds best matching candidate CVs for a given job description
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

    // Use hybridMatchCVsToJob
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
      method: "Hybrid Skill Matching",
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
 * Uses Model 2 (CV Classifier) service
 */
export const classifyCV = async (req, res) => {
  try {
    console.log("🎯 Classifying CV for user:", req.user.email);

    // Get candidate's CV text
    const candidate = await Candidate.findOne({ email: req.user.email });
    if (!candidate || !candidate.resumeText || candidate.resumeText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "No CV found. Please upload your CV first.",
      });
    }

    const cvText = candidate.resumeText;
    console.log("📄 CV Text Length:", cvText.length, "characters");

    // Check if Model 2 is available
    const isModel2Available = await checkMLServiceHealth(CV_CLASSIFIER_URL, "Model 2 (CV Classifier)");
    
    if (!isModel2Available) {
      return res.status(503).json({
        success: false,
        message: "CV Classifier Service is not running. Please start it first.",
        hint: "Run: python model-2-cv-classifier/cv_classifier.py",
      });
    }

    // Call Model 2 (CV Classifier) service
    console.log("🔬 Calling CV Classifier Service at:", CV_CLASSIFIER_URL);

    const response = await axios.post(
      `${CV_CLASSIFIER_URL}/classify`,
      {
        cv_text: cvText,
        use_groq_analysis: true,
      },
      { timeout: 30000 }
    );

    if (response.data.success) {
      console.log("✅ Classification successful!");
      console.log("   Job Title:", response.data.job_title);
      console.log("   Confidence:", response.data.confidence);

      // Update candidate with classified job title
      candidate.jobTitle = response.data.job_title;

      // Save classification results
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
        },
        message: "CV classified successfully!",
      });
    } else {
      throw new Error(response.data.error || "Classification failed");
    }
  } catch (error) {
    console.error("❌ Error classifying CV:", error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "CV Classifier Service is not running. Please start it first.",
        hint: "Run: python model-2-cv-classifier/cv_classifier.py",
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
 * Uses Model 3 (Skill Analyzer) service
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
    if (!candidate || !candidate.resumeText || candidate.resumeText.trim() === "") {
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

    // Check if Model 3 is available
    const isModel3Available = await checkMLServiceHealth(SKILL_MATCHER_URL, "Model 3 (Skill Analyzer)");
    
    if (isModel3Available) {
      try {
        console.log("🤖 Calling Model 3 (Skill Analyzer) via HTTP");

        const analyzerResponse = await axios.post(
          `${SKILL_MATCHER_URL}/analyze`,
          {
            cv_text: cvText,
            job_desc: jobDescription,
          },
          { timeout: 30000 }
        );

        if (analyzerResponse.data.success) {
          const analysisData = analyzerResponse.data.data;

          console.log("✅ Skill Analysis Complete:");
          console.log(`   - Match: ${analysisData.match_percentage}%`);
          console.log(`   - Matched Skills: ${analysisData.matched_skills.length}`);
          console.log(`   - Missing Skills: ${analysisData.missing_skills.length}`);

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
              mlService: "model3_http",
            },
          });
        } else {
          throw new Error("Skill Analyzer returned unsuccessful response");
        }
      } catch (mlError) {
        console.error("❌ Model 3 HTTP call failed:", mlError.message);
        console.log("⚠️  Falling back to basic text analysis...");
      }
    }

    // Fallback: Extract skills from job description
    console.log("⚠️  Falling back to basic text analysis...");

    const skillPatterns = [
      "python", "javascript", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift", "kotlin", "typescript",
      "react", "vue", "angular", "node.js", "express", "django", "flask", "spring", "laravel",
      "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "oracle",
      "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd", "terraform",
      "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "data analysis",
      "communication", "leadership", "teamwork", "problem solving", "critical thinking", "time management",
      "project management", "agile", "scrum", "product management", "business analysis",
      "git", "github", "api", "rest", "graphql", "microservices", "testing", "debugging",
    ];

    const jobDescLower = jobDescription.toLowerCase();
    const cvTextLower = cvText.toLowerCase();

    const foundJobSkills = skillPatterns.filter((skill) =>
      jobDescLower.includes(skill.toLowerCase())
    );

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
          message: "No skills detected in job description. Please add more details.",
        },
      });
    }

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
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " tutorial")}`,
    }));

    console.log(`✅ Fallback Analysis Complete:`);
    console.log(`   - Skills extracted from job description: ${foundJobSkills.length}`);
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
  } catch (error) {
    console.error("❌ Error in analyzeJobForUser:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze job",
    });
  }
};
