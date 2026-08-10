import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    metrics: {
      totalJobs: {
        type: Number,
        default: 0,
      },
      totalCandidates: {
        type: Number,
        default: 0,
      },
      totalApplications: {
        type: Number,
        default: 0,
      },
      avgMatchRate: {
        type: Number,
        default: 0,
      },
      interviewsScheduled: {
        type: Number,
        default: 0,
      },
      hiredCount: {
        type: Number,
        default: 0,
      },
    },
    applicationsOverTime: [
      {
        date: Date,
        count: Number,
      },
    ],
    topSkills: [
      {
        skill: String,
        count: Number,
      },
    ],
    matchRateDistribution: [
      {
        range: String,
        count: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Analytics", analyticsSchema);
