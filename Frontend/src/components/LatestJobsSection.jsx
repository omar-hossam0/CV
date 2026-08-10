import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.jsx";

const LatestJobsSection = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initialize scroll reveal animations
  useScrollReveal();

  // Fetch latest 3 jobs
  const fetchLatestJobs = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching latest jobs from API...");
      const res = await fetch("http://localhost:5000/api/jobs/latest");
      const data = await res.json();
      console.log("📦 API Response:", data);
      if (!res.ok) throw new Error(data?.message || "Failed to load jobs");

      const list = data.data || data.jobs || [];
      console.log("✅ Jobs loaded:", list.length, "jobs");
      setJobs(list);
    } catch (e) {
      console.error("❌ Error loading jobs:", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestJobs();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchLatestJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Re-trigger scroll reveal when jobs are loaded
  useEffect(() => {
    if (jobs.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const event = new Event("DOMContentLoaded");
        window.dispatchEvent(event);
      }, 100);
    }
  }, [jobs]);

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleApply = (job) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    // Must be logged in AND be an employee (not HR) to apply
    if (!token || !user || user.role !== "employee") {
      // Show login modal - user needs to login as employee
      setSelectedJob(job);
      setShowLoginModal(true);
    } else {
      // User is logged in as employee - navigate to job details
      navigate(`/employee/jobs/${job._id || job.id}`);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    // Save job ID for redirect after login
    localStorage.setItem("redirectAfterLogin", `/employee/jobs`);
    if (selectedJob) {
      localStorage.setItem("applyToJobId", selectedJob._id || selectedJob.id);
    }
    navigate("/login");
  };

  const handleRegisterRedirect = () => {
    setShowLoginModal(false);
    // Save job ID for redirect after registration
    localStorage.setItem("redirectAfterLogin", `/employee/jobs`);
    if (selectedJob) {
      localStorage.setItem("applyToJobId", selectedJob._id || selectedJob.id);
    }
    navigate("/register");
  };

  if (loading) {
    return (
      <section
        className={`relative py-24 px-4 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p
              className={`text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Loading latest jobs...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={`relative py-24 px-4 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${isDark
                ? "bg-red-900/30 text-red-400"
                : "bg-red-100 text-red-600"
                }`}
            >
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Error loading jobs: {error}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (jobs.length === 0) {
    return (
      <section
        className={`relative py-24 px-4 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div
              className={`inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl ${isDark
                ? "bg-slate-800 border border-slate-700"
                : "bg-gray-100 border border-gray-200"
                }`}
            >
              <svg
                className={`w-16 h-16 ${isDark ? "text-slate-600" : "text-gray-400"}`}
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
              <div>
                <p
                  className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  No Jobs Available Yet
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Check back soon for new opportunities!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="latest-jobs"
      className="relative py-24 px-4 transition-colors duration-300"
      style={{ minHeight: "400px" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"
              }`}
          >
            Latest{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Job Opportunities
            </span>
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${isDark ? "text-slate-300" : "text-slate-600"
              }`}
          >
            Discover the newest positions added by top companies
          </p>
        </div>

        {/* Jobs Grid - 3 Cards */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job, index) => (
            <div
              key={job._id || job.id || index}
              className={`group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 ${isDark
                ? "bg-slate-900 border-2 border-slate-700 hover:border-blue-500"
                : "bg-white border-2 border-gray-300 shadow-xl hover:border-blue-500"
                }`}
            >
              {/* Company Logo */}
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-blue-50"
                    }`}
                >
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-12 h-12 object-contain rounded-xl"
                    />
                  ) : (
                    <svg
                      className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                    </svg>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${job.jobType === "Full-time"
                    ? "bg-green-100 text-green-700"
                    : job.jobType === "Part-time"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {job.jobType || "Full-time"}
                </span>
              </div>

              {/* Job Title */}
              <h3
                className={`text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                {job.title}
              </h3>

              {/* Company Name */}
              <p
                className={`text-sm font-medium mb-4 ${isDark ? "text-blue-400" : "text-blue-600"
                  }`}
              >
                {job.company}
              </p>

              {/* Location & Department */}
              <div className="flex flex-wrap gap-3 mb-6">
                {job.location && (
                  <span
                    className={`flex items-center gap-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
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
                    {job.location}
                  </span>
                )}
                {job.department && (
                  <span
                    className={`flex items-center gap-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {job.department}
                  </span>
                )}
              </div>

              {/* Salary */}
              {(job.salaryMin || job.salaryMax) && (
                <p
                  className={`text-lg font-semibold mb-6 ${isDark ? "text-green-400" : "text-green-600"
                    }`}
                >
                  {job.currency || "$"}
                  {job.salaryMin?.toLocaleString() || "0"} -{" "}
                  {job.currency || "$"}
                  {job.salaryMax?.toLocaleString() || "N/A"}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => handleViewDetails(job)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${isDark
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-gray-100 text-slate-900 hover:bg-gray-200"
                    }`}
                >
                  View Details
                </button>
                <button
                  onClick={() => handleApply(job)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Details Modal */}
      {showDetailsModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 transform transition-all duration-500 animate-zoomIn ${isDark ? "bg-slate-800" : "bg-white"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
                }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Job Header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-blue-50"
                  }`}
              >
                {selectedJob.companyLogo ? (
                  <img
                    src={selectedJob.companyLogo}
                    alt={selectedJob.company}
                    className="w-14 h-14 object-contain rounded-xl"
                  />
                ) : (
                  <svg
                    className={`w-10 h-10 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"
                    }`}
                >
                  {selectedJob.title}
                </h2>
                <p
                  className={`text-lg font-medium ${isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                >
                  {selectedJob.company}
                </p>
              </div>
            </div>

            {/* Job Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {selectedJob.location && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-50"
                    }`}
                >
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                  <span
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  >
                    {selectedJob.location}
                  </span>
                </div>
              )}
              {selectedJob.jobType && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-50"
                    }`}
                >
                  <svg
                    className="w-5 h-5 text-green-500"
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
                  <span
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  >
                    {selectedJob.jobType}
                  </span>
                </div>
              )}
              {selectedJob.department && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-50"
                    }`}
                >
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  >
                    {selectedJob.department}
                  </span>
                </div>
              )}
              {selectedJob.experienceLevel && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-50"
                    }`}
                >
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  <span
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  >
                    {selectedJob.experienceLevel}
                  </span>
                </div>
              )}
            </div>

            {/* Salary */}
            {(selectedJob.salaryMin || selectedJob.salaryMax) && (
              <div
                className={`p-4 rounded-xl mb-6 ${isDark ? "bg-green-900/30" : "bg-green-50"
                  }`}
              >
                <p
                  className={`text-xl font-bold ${isDark ? "text-green-400" : "text-green-600"
                    }`}
                >
                  Salary: {selectedJob.currency || "$"}
                  {selectedJob.salaryMin?.toLocaleString() || "0"} -{" "}
                  {selectedJob.currency || "$"}
                  {selectedJob.salaryMax?.toLocaleString() || "N/A"}
                </p>
              </div>
            )}

            {/* Description */}
            {selectedJob.description && (
              <div className="mb-6">
                <h3
                  className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"
                    }`}
                >
                  Job Description
                </h3>
                <p
                  className={`leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                >
                  {selectedJob.description}
                </p>
              </div>
            )}

            {/* Required Skills */}
            {selectedJob.requiredSkills &&
              selectedJob.requiredSkills.length > 0 && (
                <div className="mb-6">
                  <h3
                    className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"
                      }`}
                  >
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${isDark
                          ? "bg-blue-900/50 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Apply Button in Modal */}
            <button
              onClick={() => {
                setShowDetailsModal(false);
                handleApply(selectedJob);
              }}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Apply Now
            </button>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className={`relative w-full max-w-md rounded-3xl p-8 transform transition-all duration-500 animate-zoomIn ${isDark ? "bg-slate-800" : "bg-white"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
                }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? "bg-blue-900/50" : "bg-blue-100"
                  }`}
              >
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Title - Check if user is HR */}
            {(() => {
              const user = JSON.parse(localStorage.getItem("user") || "null");
              const isHR = user?.role === "hr";
              return (
                <>
                  <h2
                    className={`text-2xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"
                      }`}
                  >
                    {isHR ? "Employee Account Required" : "Login Required"}
                  </h2>
                  <p
                    className={`text-center mb-8 ${isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
                    {isHR
                      ? "You are logged in as HR. Please login with an Employee account to apply for jobs."
                      : "You need to login or create an account to apply for this job"
                    }
                  </p>
                </>
              );
            })()}

            {/* Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleLoginRedirect}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                Login as Employee
              </button>
              <button
                onClick={handleRegisterRedirect}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${isDark
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-gray-100 text-slate-900 hover:bg-gray-200"
                  }`}
              >
                Create Employee Account
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LatestJobsSection;
