import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get latest 3 jobs (public endpoint - no auth required)
export const getLatestJobs = async (req, res) => {
  try {
    // Get the latest 3 active jobs sorted by creation date
    const jobs = await Job.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("postedBy", "name email");

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    let query = {};

    // HR sees only their posted jobs, employees see all active jobs
    if (req.user.role === "hr") {
      query = { postedBy: req.user.id };
    } else {
      // Employees see all active jobs
      query = { status: "Active" };
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .populate("postedBy", "name email");

    // For employees: calculate match scores using Python BERT matcher
    let enrichedJobs = jobs;
    // Accept both "employee" and "user" roles for employees
    if (req.user.role === "employee" || req.user.role === "user") {
      try {
        console.log(
          "📊 Calculating match scores for user with role:",
          req.user.role,
        );
        // Import pythonMatcher here to avoid circular dependency
        const { getPythonMatcher } = await import("../utils/pythonMatcher.js");
        const pythonMatcher = getPythonMatcher();

        const candidate = await Candidate.findOne({ email: req.user.email });
        if (candidate && candidate.resumeText && candidate.resumeText.trim()) {
          const cvText = candidate.resumeText;
          const jobDescriptions = jobs.map((job) => job.description || "");

          console.log(`🔍 Matching CV against ${jobs.length} jobs...`);

          let matches;
          try {
            // Try Python BERT matcher first
            matches = await Promise.race([
              pythonMatcher.match(cvText, jobDescriptions, jobs.length),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 30000),
              ),
            ]);
            console.log("✅ Used Python BERT matcher");
          } catch (pythonError) {
            console.warn(
              "⚠️  Python matcher failed, falling back to hybrid matcher:",
              pythonError.message,
            );
            // Fallback to hybrid matcher
            const { hybridMatch } = await import("../utils/hybridMatcher.js");
            const results = hybridMatch(cvText, jobs, jobs.length);
            // Convert hybridMatch format { job, matchScore } to Python format { job_index, similarity_score }
            matches = results.map((r) => {
              const jobIdx = jobs.findIndex(
                (j) => j._id.toString() === r.job._id.toString(),
              );
              return {
                job_index: jobIdx,
                similarity_score: r.matchScore / 100, // hybridMatch returns 0-100, but API expects 0-1
              };
            });
            console.log("✅ Used Hybrid matcher as fallback");
          }

          enrichedJobs = jobs.map((job, idx) => {
            const matchData = matches.find((m) => m.job_index === idx);
            const jobObj = job.toObject();
            jobObj.matchScore = matchData
              ? Math.round(matchData.similarity_score * 100) / 100
              : 0;
            return jobObj;
          });

          console.log(
            "✅ Match scores calculated:",
            enrichedJobs
              .slice(0, 3)
              .map((j) => ({ title: j.title, score: j.matchScore })),
          );

          // Sort by match score descending
          enrichedJobs.sort(
            (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
          );
        } else {
          console.log("⚠️  No resume found for candidate:", req.user.email);
        }
      } catch (matchError) {
        console.error(
          "❌ Failed to calculate match scores:",
          matchError.message,
        );
        // Continue without match scores
      }
    } else {
      console.log("ℹ️  Role is HR, skipping match score calculation");
    }

    res.json({
      success: true,
      count: enrichedJobs.length,
      data: enrichedJobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get single job
export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name email",
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Create new job
export const createJob = async (req, res) => {
  try {
    console.log(
      "📥 createJob called by user:",
      req.user ? req.user._id : "unknown",
    );
    console.log("📋 req.body keys:", Object.keys(req.body));
    if (req.file)
      console.log(
        "📎 Uploaded file:",
        req.file.originalname,
        "size:",
        req.file.size,
      );
    const {
      title,
      description,
      department,
      requiredSkills,
      experienceLevel,
      salary,
      location,
      jobType,
      company,
      applicationQuestions,
    } = req.body;

    // Parse requiredSkills if it's a string
    let skillsArray = requiredSkills;
    if (typeof requiredSkills === "string") {
      skillsArray = requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill);
    }

    // Parse applicationQuestions if it's a string
    let questionsArray = [];
    if (applicationQuestions) {
      if (typeof applicationQuestions === "string") {
        try {
          questionsArray = JSON.parse(applicationQuestions);
        } catch (e) {
          console.log("Failed to parse applicationQuestions:", e);
        }
      } else if (Array.isArray(applicationQuestions)) {
        questionsArray = applicationQuestions;
      }
    }

    // Parse salary if it's sent as separate fields
    let salaryObj = salary;
    if (req.body.salaryMin || req.body.salaryMax) {
      salaryObj = {
        min: req.body.salaryMin ? Number(req.body.salaryMin) : undefined,
        max: req.body.salaryMax ? Number(req.body.salaryMax) : undefined,
        currency: req.body.currency || "USD",
      };
    }

    // Handle company logo if uploaded
    let companyLogo = null;
    if (req.file) {
      companyLogo = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
    }

    const job = await Job.create({
      title,
      description,
      department,
      requiredSkills: skillsArray,
      experienceLevel,
      salary: salaryObj,
      location,
      jobType,
      company: company || "Company Name",
      companyLogo,
      applicationQuestions: questionsArray,
      postedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Search jobs
export const searchJobs = async (req, res) => {
  try {
    const { q, status, experienceLevel } = req.query;
    let query = { postedBy: req.user.id };

    if (q) {
      query.$text = { $search: q };
    }
    if (status) {
      query.status = status;
    }
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get job applicants
export const getJobApplicants = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      "applications.jobId": req.params.id,
    });

    // Extract application details for this specific job
    const applicantsWithDetails = candidates.map((candidate) => {
      const application = candidate.applications.find(
        (app) => app.jobId && app.jobId.toString() === req.params.id,
      );

      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        skills: candidate.skills,
        experience: candidate.experience,
        experienceLevel: candidate.experienceLevel,
        jobTitle: candidate.jobTitle,
        resumeUrl: candidate.resumeUrl,
        appliedAt: application?.appliedAt,
        status: application?.status,
        answers: application?.answers,
      };
    });

    res.json({
      success: true,
      count: applicantsWithDetails.length,
      data: applicantsWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Apply to a job
export const applyToJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { answers } = req.body; // Get answers from request body

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Find or create candidate profile
    let candidate = await Candidate.findOne({ email: userEmail });

    if (!candidate) {
      // Create basic candidate profile if doesn't exist
      candidate = await Candidate.create({
        email: userEmail,
        name: req.user.name || "Candidate",
        applications: [],
      });
    }

    // Check if already applied
    const alreadyApplied = candidate.applications?.some(
      (app) => app.jobId && app.jobId.toString() === jobId,
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    // Add application
    candidate.applications = candidate.applications || [];
    candidate.applications.push({
      jobId: jobId,
      appliedAt: new Date(),
      status: "Applied",
      answers: answers || {}, // Save the answers
    });

    await candidate.save();

    // Create notification for HR who posted the job
    await Notification.create({
      userId: job.postedBy,
      title: "New Job Application",
      message: `${req.user.name || candidate.name} applied for ${job.title}`,
      type: "application",
      jobId: jobId,
      applicantId: req.user.id,
      link: `/hr/jobs/${jobId}/applicants`,
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      data: {
        jobId: jobId,
        jobTitle: job.title,
        appliedAt: new Date(),
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

// Withdraw application from a job
export const withdrawApplication = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userEmail = req.user.email;

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Find candidate profile
    const candidate = await Candidate.findOne({ email: userEmail });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    // Check if applied
    const applicationIndex = candidate.applications?.findIndex(
      (app) => app.jobId && app.jobId.toString() === jobId,
    );

    if (applicationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You have not applied to this job",
      });
    }

    // Remove application
    candidate.applications.splice(applicationIndex, 1);
    await candidate.save();

    res.json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// Get saved jobs for HR
export const getSavedJobsHR = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).populate(
      "savedJobs",
      "title department company jobType location salary status",
    );

    if (!user) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: user.savedJobs });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
};

// Toggle save/unsave a job for HR
export const toggleSaveJobHR = async (req, res) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId",
      });
    }

    const job = await Job.findById(jobId).select("_id");
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const idStr = job._id.toString();
    const current = new Set((user.savedJobs || []).map((j) => j.toString()));

    let action = "saved";
    if (current.has(idStr)) {
      // Unsave
      user.savedJobs = user.savedJobs.filter((j) => j.toString() !== idStr);
      action = "unsaved";
    } else {
      // Save
      user.savedJobs.push(job._id);
    }

    await user.save();

    const populated = await User.findById(user._id)
      .populate(
        "savedJobs",
        "title department company jobType salary location status",
      )
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
