import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    matchedJobs: 0,
    applications: 0,
    savedJobs: 0,
  });

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);

    // Redirect HR to HR dashboard
    if (userData.role === "hr") {
      navigate("/hr/dashboard");
      return;
    }

    setUser(userData);
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);
      console.log("Fetching jobs for dashboard...");

      // Fetch jobs from API
      const res = await fetch("${API_BASE_URL}/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Jobs data received from API:", data); // For debugging
      console.log("First job matchScore:", data.data?.[0]?.matchScore);
      console.log("Second job matchScore:", data.data?.[1]?.matchScore);

      // Ensure we're getting the data array
      let jobsList = data.data || data.jobs || [];

      // Verify matchScores are present
      if (jobsList.length > 0 && !jobsList[0].matchScore) {
        console.warn("WARNING: No matchScore in jobs data!");
        console.log("Job structure:", JSON.stringify(jobsList[0], null, 2));
      }

      setJobs(jobsList.slice(0, 6)); // Get top 6 jobs for dashboard
      setStats({
        totalJobs: jobsList.length,
        matchedJobs: jobsList.filter(
          (job) => job.matchScore && job.matchScore > 50
        ).length,
        applications: 5,
        savedJobs: 3,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Show empty state on error
      setJobs([]);
      setStats({
        totalJobs: 0,
        matchedJobs: 0,
        applications: 0,
        savedJobs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 font-semibold">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 pb-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div
            className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
              Welcome back, <span className="text-yellow-300">{user.name}</span>
              !
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Let's continue your career journey and find the perfect
              opportunity for you
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Total Jobs */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? "..." : stats.totalJobs}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                Available Jobs
              </div>
            </div>

            {/* Matched Jobs */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? "..." : stats.matchedJobs}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                Matched Jobs
              </div>
            </div>

            {/* Applications */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.applications}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                Applications
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.savedJobs}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                Saved Jobs
              </div>
            </div>
          </div>
        </div>

        {/* Curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#0f172a"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-12 relative z-10">
        {/* Featured Jobs Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Recommended Jobs For You
              </h2>
              <p className="text-slate-400">
                Based on your profile and preferences
              </p>
            </div>
            <Link
              to="/employee/jobs"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              View All Jobs
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-slate-700 rounded-2xl p-6 h-64"
                ></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-24 h-24 mx-auto text-slate-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-slate-500 text-lg">
                No jobs available at the moment
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <div
                  key={job._id || index}
                  className="group bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                >
                  {/* Match Score Badge */}
                  {job.matchScore !== undefined &&
                    job.matchScore > 0 &&
                    (() => {
                      // Normalize score (backend may send 0..1 or 0..100)
                      const scoreNum =
                        job.matchScore > 1
                          ? job.matchScore
                          : job.matchScore * 100;

                      // Determine match level and color
                      const matchLevel =
                        scoreNum >= 80
                          ? "Excellent Match"
                          : scoreNum >= 60
                          ? "Fair Match"
                          : "Low Match";

                      const bgColor =
                        scoreNum >= 80
                          ? "from-green-500 to-emerald-600"
                          : scoreNum >= 60
                          ? "from-yellow-500 to-orange-500"
                          : "from-red-500 to-pink-500";

                      return (
                        <div
                          className={`absolute top-4 right-4 bg-gradient-to-r ${bgColor} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10`}
                        >
                          {Number(scoreNum).toFixed(1)}% - {matchLevel}
                        </div>
                      );
                    })()}

                  {/* Company Logo - Real or Placeholder */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="text-white font-bold text-xl"
                      style={{ display: job.companyLogo ? "none" : "flex" }}
                    >
                      {job.company?.charAt(0) || "C"}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {job.title}
                  </h3>

                  {/* Company Name */}
                  <p className="text-slate-400 font-semibold mb-4">
                    {job.company}
                  </p>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{job.jobType || "Full-time"}</span>
                    </div>
                    {job.salaryMin && job.salaryMax && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <span>
                          ${job.salaryMin.toLocaleString()} - $
                          {job.salaryMax.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requiredSkills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-cyan-900/30 text-cyan-400 text-xs font-semibold rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-semibold rounded-full">
                          +{job.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    to={`/employee/jobs/${job._id}`}
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-1 gap-8 mb-8">
          {/* Upload CV Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Upload Your CV</h3>
                <p className="text-white/80">
                  Get AI-powered job recommendations
                </p>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                AI-Powered Analysis
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Instant Job Matching
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Skill Gap Insights
              </li>
            </ul>
            <Link
              to="/employee/profile"
              className="block w-full text-center px-6 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Upload CV Now
            </Link>
          </div>
        </div>

        {/* Career Progress */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Your Career Progress
              </h2>
              <p className="text-slate-400">
                Keep building your profile to unlock more opportunities
              </p>
            </div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              65%
            </div>
          </div>

          <div className="relative w-full bg-slate-700 rounded-full h-6 mb-8">
            <div
              className="absolute top-0 left-0 h-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: "65%" }}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white">Profile Created</h4>
                <p className="text-sm text-slate-400">Complete</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white">Upload CV</h4>
                <p className="text-sm text-blue-400">In Progress</p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white">Apply to Jobs</h4>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white">Get Hired</h4>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
