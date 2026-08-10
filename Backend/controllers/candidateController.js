import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import pdf from "pdf-parse";
import { getGridFSBucket } from "../config/gridfs.js";
import { Readable } from "stream";
import mongoose from "mongoose";
import axios from "axios";
import { ObjectId } from "mongodb";

// CV Classifier Service URL
const CV_CLASSIFIER_URL =
  process.env.CV_CLASSIFIER_URL || "http://127.0.0.1:5002";

// Helper: Extract fields from CV text using simple regex patterns
function extractFieldsFromText(text) {
  const extracted = {
    skills: [],
    experience: 0,
    university: "",
    degree: "",
    phone: "",
  };

  if (!text) return extracted;

  const lowerText = text.toLowerCase();

  // Extract skills (common tech skills)
  const skillPatterns = [
    /\b(javascript|js|typescript|ts|react|angular|vue|node\.?js|express|mongodb|mysql|postgresql|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|html|css|sass|tailwind|bootstrap|git|docker|kubernetes|aws|azure|gcp|machine learning|ai|data science|pandas|numpy|tensorflow|pytorch)\b/gi,
  ];

  const foundSkills = new Set();
  skillPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) =>
        foundSkills.add(m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())
      );
    }
  });
  extracted.skills = Array.from(foundSkills).slice(0, 15); // limit to 15 skills

  // Extract years of experience
  const expPatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
    /experience[:\s]+(\d+)\+?\s*years?/i,
    /(\d+)\s*years?\s+(?:in|as|with)/i,
  ];

  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      extracted.experience = parseInt(match[1]);
      break;
    }
  }

  // Extract university
  const uniPatterns = [
    /university[:\s]+([^\n]{5,60})/i,
    /(cairo university|ain shams university|alexandria university|harvard|mit|stanford|oxford|cambridge)/i,
    /\b([A-Z][a-z]+\s+University)\b/,
  ];

  for (const pattern of uniPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      extracted.university = match[1].trim();
      break;
    }
  }

  // Extract degree
  const degreePatterns = [
    /\b(bachelor|master|phd|doctorate|b\.?sc|m\.?sc|mba|b\.?a|m\.?a|b\.?eng|m\.?eng)\s+(?:of|in|degree)?\s*([^\n]{5,60})?/i,
    /(computer science|engineering|business administration|data science|information technology|software engineering)/i,
  ];

  for (const pattern of degreePatterns) {
    const match = text.match(pattern);
    if (match) {
      extracted.degree = match[0].trim().substring(0, 100);
      break;
    }
  }

  // Extract phone
  const phonePatterns = [
    /(\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/,
    /\b\d{10,15}\b/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      extracted.phone = match[0].trim();
      break;
    }
  }

  return extracted;
}

// Get all candidates
export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .sort({ createdAt: -1 })
      .populate("applications.jobId", "title department");

    res.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get single candidate
export const getCandidate = async (req, res) => {
  try {
    let candidate;
    const id = req.params.id;

    // First try to find by Candidate ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      candidate = await Candidate.findById(id).populate(
        "applications.jobId",
        "title department"
      );
    }

    // If not found, try to find by email (User ID lookup)
    if (!candidate) {
      // Try to find candidate by looking up user email
      const User = mongoose.model("User");
      const user = await User.findById(id);
      if (user && user.email) {
        candidate = await Candidate.findOne({ email: user.email }).populate(
          "applications.jobId",
          "title department"
        );
      }
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Create candidate
export const createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create candidate",
      error: error.message,
    });
  }
};

// Update candidate
export const updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update candidate",
      error: error.message,
    });
  }
};

// Delete candidate
export const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Search candidates
export const searchCandidates = async (req, res) => {
  try {
    const { q, skills, experienceLevel, minExperience } = req.query;
    let query = {};

    if (q) {
      query.$text = { $search: q };
    }
    if (skills) {
      query.skills = { $in: skills.split(",") };
    }
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }
    if (minExperience) {
      query.experience = { $gte: parseInt(minExperience) };
    }

    const candidates = await Candidate.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Apply for job
export const applyForJob = async (req, res) => {
  try {
    const { candidateId, jobId, matchPercentage } = req.body;

    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({
        success: false,
        message: "Candidate or Job not found",
      });
    }

    // Check if already applied
    const alreadyApplied = candidate.applications.some(
      (app) => app.jobId.toString() === jobId
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "Already applied to this job",
      });
    }

    // Add application
    candidate.applications.push({
      jobId,
      matchPercentage: matchPercentage || 0,
      status: "Applied",
    });

    await candidate.save();

    // Update job applicants count
    job.applicantsCount += 1;
    await job.save();

    res.json({
      success: true,
      message: "Application submitted successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to apply",
      error: error.message,
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { candidateId, jobId, status } = req.body;

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const application = candidate.applications.find(
      (app) => app.jobId.toString() === jobId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    await candidate.save();

    res.json({
      success: true,
      message: "Application status updated",
      data: candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

// Get my profile (for authenticated employee)
export const getMyProfile = async (req, res) => {
  try {
    console.log("👤 Getting profile for:", req.user.email);

    const candidate = await Candidate.findOne({ email: req.user.email });

    if (!candidate) {
      console.log("⚠️ No candidate profile found, returning empty");
      return res.json({
        success: true,
        data: null,
        message: "No profile found. Please create one.",
      });
    }

    console.log("✅ Profile found:", candidate._id);

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Calculate match percentage (AI placeholder)
export const calculateMatch = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({
        success: false,
        message: "Candidate or Job not found",
      });
    }

    // Simple matching algorithm
    const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
    const requiredSkills = job.requiredSkills.map((s) => s.toLowerCase());

    const matchingSkills = candidateSkills.filter((skill) =>
      requiredSkills.includes(skill)
    );

    const matchPercentage = Math.round(
      (matchingSkills.length / requiredSkills.length) * 100
    );

    res.json({
      success: true,
      data: {
        matchPercentage,
        matchingSkills,
        missingSkills: requiredSkills.filter(
          (skill) => !candidateSkills.includes(skill)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Upload resume (PDF) and extract text
export const uploadResume = async (req, res) => {
  try {
    console.log("📤 Upload request received from user:", req.user?.email);
    console.log(
      "📄 File received:",
      req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "NO FILE"
    );

    // multer memoryStorage places file in req.file.buffer
    if (!req.file || !req.file.buffer) {
      console.log("❌ No file uploaded");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const bucket = getGridFSBucket();
    const buffer = req.file.buffer;
    const filename = `${req.user._id}_${Date.now()}.pdf`;

    console.log("💾 Uploading to GridFS:", filename);

    // Upload file to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "application/pdf",
      metadata: {
        userId: req.user._id,
        email: req.user.email,
        uploadedAt: new Date(),
      },
    });

    // Create readable stream from buffer and pipe to GridFS
    const readableStream = Readable.from(buffer);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    const fileId = uploadStream.id;

    console.log("✅ File uploaded to GridFS with ID:", fileId.toString());

    // Extract text from PDF buffer
    let extractedText = "";
    try {
      const data = await pdf(buffer);
      extractedText = data && data.text ? data.text : "";
      console.log("📝 Text extracted, length:", extractedText.length, "chars");
    } catch (e) {
      console.warn("⚠️ PDF parse failed:", e.message);
      extractedText = "";
    }

    // Extract structured fields from text
    const extractedFields = extractFieldsFromText(extractedText);

    console.log("🔍 Extracted fields:", {
      skills: extractedFields.skills.length,
      university: extractedFields.university,
      degree: extractedFields.degree,
      phone: extractedFields.phone,
    });

    // Find candidate by authenticated user's email or create/update
    let candidate = null;
    if (req.user && req.user.email) {
      candidate = await Candidate.findOne({ email: req.user.email });
      console.log("🔎 Found existing candidate:", candidate ? "YES" : "NO");
    }

    if (!candidate) {
      // create a minimal candidate record with extracted data
      candidate = await Candidate.create({
        name: req.user?.name || req.user?.email || "Unknown",
        email: req.user?.email || `unknown_${Date.now()}@local`,
        resumeUrl: fileId.toString(), // Store GridFS file ID
        resumeText: extractedText,
        skills: extractedFields.skills.length > 0 ? extractedFields.skills : [],
        experience: extractedFields.experience || 0,
        university: extractedFields.university || "",
        degree: extractedFields.degree || "",
        phone: extractedFields.phone || "",
      });
    } else {
      // Update existing candidate with extracted data
      candidate.resumeUrl = fileId.toString(); // Store GridFS file ID
      candidate.resumeText = extractedText;

      // Clear old classification when uploading new CV
      candidate.classificationResult = null;
      candidate.jobTitle = "";

      // Merge skills (avoid duplicates)
      if (extractedFields.skills.length > 0) {
        const existingSkills = new Set(
          candidate.skills.map((s) => s.toLowerCase())
        );
        extractedFields.skills.forEach((skill) => {
          if (!existingSkills.has(skill.toLowerCase())) {
            candidate.skills.push(skill);
          }
        });
      }

      // Update other fields only if they're empty or extracted value is better
      if (extractedFields.experience > 0 && candidate.experience === 0) {
        candidate.experience = extractedFields.experience;
      }
      if (extractedFields.university && !candidate.university) {
        candidate.university = extractedFields.university;
      }
      if (extractedFields.degree && !candidate.degree) {
        candidate.degree = extractedFields.degree;
      }
      if (extractedFields.phone && !candidate.phone) {
        candidate.phone = extractedFields.phone;
      }

      await candidate.save();
    }

    console.log("💾 Candidate saved to MongoDB:", candidate._id.toString());
    console.log("📊 Final candidate data:", {
      skills: candidate.skills.length,
      experience: candidate.experience,
      university: candidate.university,
      resumeUrl: candidate.resumeUrl,
    });

    // Auto-classify CV job title
    let classificationResult = null;
    if (extractedText && extractedText.length > 50) {
      try {
        console.log("🔬 Auto-classifying CV...");
        const classifyResponse = await axios.post(
          `${CV_CLASSIFIER_URL}/classify`,
          {
            cv_text: extractedText,
            use_groq_analysis: true,
          },
          {
            timeout: 30000, // 30 seconds timeout (increased)
          }
        );

        if (classifyResponse.data.success) {
          const jobTitle = classifyResponse.data.job_title;
          const confidence = classifyResponse.data.confidence;

          console.log(
            `✅ Auto-classified as: ${jobTitle} (${(confidence * 100).toFixed(
              1
            )}%)`
          );

          // Update candidate with classified job title AND save classification results
          candidate.jobTitle = jobTitle;

          // Save classification results for persistence
          candidate.classificationResult = {
            jobTitle: jobTitle,
            confidence: confidence,
            method: classifyResponse.data.decision_method,
            classifiedAt: new Date(),
          };

          await candidate.save();
          console.log("💾 Auto-classification results saved to database");

          classificationResult = {
            jobTitle: jobTitle,
            confidence: confidence,
            method: classifyResponse.data.decision_method,
          };
        } else {
          console.warn("⚠️ Classification returned success=false");
        }
      } catch (classifyError) {
        console.warn(
          "⚠️ Auto-classification failed (non-critical):",
          classifyError.message
        );
        // Don't fail the upload if classification fails
      }
    } else {
      console.log("⚠️ CV text too short for classification:", extractedText?.length || 0, "chars");
    }

    return res.json({
      success: true,
      message: "Resume uploaded to MongoDB and text extracted",
      data: {
        resumeFileId: fileId.toString(),
        resumeText: extractedText,
        extractedFields: extractedFields,
        candidateId: candidate._id,
        candidate: {
          skills: candidate.skills,
          experience: candidate.experience,
          university: candidate.university,
          degree: candidate.degree,
          phone: candidate.phone,
          jobTitle: candidate.jobTitle || null,
        },
        classification: classificationResult,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Upload failed", error: error.message });
  }
};

// Download Resume from GridFS
export const downloadResume = async (req, res) => {
  try {
    let candidate;
    const id = req.params.id;

    // First try to find by Candidate ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      candidate = await Candidate.findById(id);
    }

    // If not found, try to find by User ID (lookup user email first)
    if (!candidate) {
      const User = mongoose.model("User");
      const user = await User.findById(id);
      if (user && user.email) {
        candidate = await Candidate.findOne({ email: user.email });
      }
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (!candidate.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: "No resume found for this candidate",
      });
    }

    const bucket = getGridFSBucket();
    const fileId = new ObjectId(candidate.resumeUrl);

    // Find file in GridFS
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resume file not found in storage",
      });
    }

    const file = files[0];

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${candidate.name}_CV.pdf"`,
      "Content-Length": file.length,
    });

    // Stream file to response
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on("error", (error) => {
      console.error("Download stream error:", error);
      res.status(500).json({
        success: false,
        message: "Error streaming file",
        error: error.message,
      });
    });
  } catch (error) {
    console.error("Download resume error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download resume",
      error: error.message,
    });
  }
};

// Get saved jobs for the authenticated employee
export const getSavedJobs = async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    let candidate = await Candidate.findOne({ email }).populate(
      "savedJobs",
      "title department company jobType salary location"
    );

    if (!candidate) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: candidate.savedJobs });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
};

// Toggle save/unsave a job for the authenticated employee
export const toggleSaveJob = async (req, res) => {
  try {
    const email = req.user?.email;
    const jobId = req.params.jobId;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId",
      });
    }

    const job = await Job.findById(jobId).select("_id");
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    let candidate = await Candidate.findOne({ email });
    if (!candidate) {
      candidate = await Candidate.create({
        name: req.user?.name || email,
        email,
        savedJobs: [],
      });
    }

    const idStr = job._id.toString();
    const current = new Set((candidate.savedJobs || []).map((j) => j.toString()));

    let action = "saved";
    if (current.has(idStr)) {
      // Unsave
      candidate.savedJobs = candidate.savedJobs.filter(
        (j) => j.toString() !== idStr
      );
      action = "unsaved";
    } else {
      // Save
      candidate.savedJobs.push(job._id);
    }

    await candidate.save();

    const populated = await Candidate.findById(candidate._id)
      .populate("savedJobs", "title department company jobType salary location")
      .select("savedJobs");

    return res.json({
      success: true,
      message: `Job ${action} successfully`,
      data: {
        action,
        savedJobs: populated.savedJobs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle saved job",
      error: error.message,
    });
  }
};

