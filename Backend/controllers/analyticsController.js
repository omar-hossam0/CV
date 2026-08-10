import Analytics from "../models/Analytics.js";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total counts
    const totalJobs = await Job.countDocuments({ postedBy: userId });
    const totalCandidates = await Candidate.countDocuments();

    // Get jobs with their applicants
    const jobs = await Job.find({ postedBy: userId });
    const totalApplications = jobs.reduce(
      (sum, job) => sum + job.applicantsCount,
      0
    );

    // Calculate average match rate
    const candidates = await Candidate.find({
      "applications.jobId": { $in: jobs.map((j) => j._id) },
    });

    let totalMatchPercentage = 0;
    let matchCount = 0;

    candidates.forEach((candidate) => {
      candidate.applications.forEach((app) => {
        if (jobs.some((j) => j._id.equals(app.jobId))) {
          totalMatchPercentage += app.matchPercentage || 0;
          matchCount++;
        }
      });
    });

    const avgMatchRate =
      matchCount > 0 ? Math.round(totalMatchPercentage / matchCount) : 0;

    // Get top skills from candidates
    const skillsMap = {};
    candidates.forEach((candidate) => {
      candidate.skills.forEach((skill) => {
        skillsMap[skill] = (skillsMap[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Match rate distribution
    const matchRanges = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];

    candidates.forEach((candidate) => {
      candidate.applications.forEach((app) => {
        if (jobs.some((j) => j._id.equals(app.jobId))) {
          const matchPercent = app.matchPercentage || 0;
          const range = matchRanges.find(
            (r) => matchPercent >= r.min && matchPercent <= r.max
          );
          if (range) range.count++;
        }
      });
    });

    const analytics = {
      metrics: {
        totalJobs,
        totalCandidates,
        totalApplications,
        avgMatchRate,
        interviewsScheduled: 0, // Can be calculated based on application status
        hiredCount: 0, // Can be calculated based on application status
      },
      topSkills,
      matchRateDistribution: matchRanges,
      applicationsOverTime: [], // Can be populated with time-series data
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Save analytics snapshot
export const saveAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.create({
      ...req.body,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Analytics saved successfully",
      data: analytics,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to save analytics",
      error: error.message,
    });
  }
};

// Get historical analytics
export const getHistoricalAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const analytics = await Analytics.find(query).sort({ date: -1 });

    res.json({
      success: true,
      count: analytics.length,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
