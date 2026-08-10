import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    university: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
      },
    ],
    experience: {
      type: Number,
      default: 0,
    },
    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Mid Level", "Senior Level", "Executive"],
      default: "Entry Level",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    resumeText: {
      type: String,
      default: "",
    },
    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },
    // CV Classification Results (persisted)
    classificationResult: {
      jobTitle: {
        type: String,
        default: "",
      },
      confidence: {
        type: Number,
        default: 0,
      },
      method: {
        type: String,
        default: "",
      },
      classifiedAt: {
        type: Date,
        default: null,
      },
    },
    // Extracted Skills from CV (for reference)
    extractedSkills: [
      {
        type: String,
      },
    ],
    // Saved Jobs (bookmarked by user)
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    linkedinUrl: {
      type: String,
      default: "",
    },
    portfolioUrl: {
      type: String,
      default: "",
    },
    applications: [
      {
        jobId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Job",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Applied", "Reviewing", "Interview", "Accepted", "Rejected"],
          default: "Applied",
        },
        matchPercentage: {
          type: Number,
          default: 0,
        },
        answers: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    location: {
      type: String,
      default: "",
    },
    availability: {
      type: String,
      enum: ["Immediate", "2 Weeks", "1 Month", "Not Available"],
      default: "Immediate",
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
candidateSchema.index({ name: "text", email: "text", skills: "text" });

export default mongoose.model("Candidate", candidateSchema);
