import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api.js";

export default function Jobs() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );
  // HR sees all jobs, Employee sees AI matched by default
  const [filter, setFilter] = useState(user?.role === "employee" ? "ai-matched" : "all");
  const [savedJobs, setSavedJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Job Details, 2 = Application Questions
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [applicationQuestions, setApplicationQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchingCVs, setMatchingCVs] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState(null);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    department: "",
    location: "",
    jobType: "Full-time",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    description: "",
    skills: "`,// comma-separated requiredSkills
    experienceLevel: "Entry Level",
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/jobs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load jobs");
        // normalize
        const list = data.data || data.jobs || [];
        setJobs(list);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user) return;

        // For HR users
        if (user.role === "hr") {
          const res = await fetch(
            `${API_BASE_URL}/api/jobs/hr/saved-jobs`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          if (res.ok && data.data) {
            const savedIds = data.data.map((job) => job._id || job.id);
            setSavedJobs(savedIds);
            console.log("Loaded saved jobs for HR:", savedIds.length);
          }
        } else if (user.role === "employee") {
          // For employees
          const res = await fetch(
            `${API_BASE_URL}/api/candidates/saved-jobs`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          if (res.ok && data.data) {
            const savedIds = data.data.map((job) => job._id || job.id);
            setSavedJobs(savedIds);
            console.log("Loaded saved jobs:", savedIds.length);
          }
        }
      } catch (e) {
        console.warn("️ Failed to load saved jobs:", e.message);
      }
    };

    fetchJobs();
    fetchSavedJobs();
  }, []);

  // Auto-load AI matched jobs for employees
  useEffect(() => {
    if (user?.role === "employee" && jobs.length > 0) {
      fetchMLMatches();
    }
  }, [jobs]);

  const toggleSave = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to save jobs");
        return;
      }

      // Determine endpoint based on user role
      const endpoint =
        user?.role === "hr"
          ? `${API_BASE_URL}/api/jobs/hr/saved-jobs/${jobId}`
          : `${API_BASE_URL}/api/candidates/saved-jobs/${jobId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state
        if (data.data.action === "saved") {
          setSavedJobs([...savedJobs, jobId]);
          console.log("Job saved");
        } else {
          setSavedJobs(savedJobs.filter((id) => id !== jobId));
          console.log("Job removed from saved");
        }
      } else {
        console.error("Failed to save job:", data.message);
      }
    } catch (e) {
      console.error("Error saving job:", e.message);
    }
  };

  const fetchMLMatches = async () => {
    try {
      setMatchLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      console.log("Fetching AI job matches...");

      const res = await fetch(`${API_BASE_URL}/api/ml/match-jobs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(60000), // 60 second timeout for ML processing
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) {
        // Show specific error message
        if (data.message && data.message.includes("No CV found")) {
          throw new Error(
            "️ Please upload your CV first to get AI recommendations!"
          );
        } else if (data.message && data.message.includes("No jobs available")) {
          throw new Error("️ No jobs available yet. Check back later!");
        }
        throw new Error(data?.message || "Failed to fetch matches");
      }

      if (!data.data || data.data.length === 0) {
        setError("️ No matching jobs found. Try uploading a more detailed CV!");
        setMatchedJobs([]);
      } else {
        setMatchedJobs(data.data || []);
        setFilter("ai-matched");
      }
    } catch (e) {
      console.error("Error:", e.message);
      setError(e.message);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      // Use FormData for file upload
      const formData = new FormData();
      formData.append("title", newJob.title);
      formData.append("company", newJob.company);
      formData.append("description", newJob.description);
      formData.append("department", newJob.department);
      formData.append("location", newJob.location);
      formData.append("jobType", newJob.jobType);
      formData.append("experienceLevel", newJob.experienceLevel);
      formData.append("currency", newJob.currency || "USD");

      // Add skills as comma-separated string
      formData.append("requiredSkills", newJob.skills);

      // Add salary if provided
      if (newJob.salaryMin) formData.append("salaryMin", newJob.salaryMin);
      if (newJob.salaryMax) formData.append("salaryMax", newJob.salaryMax);

      // Add company logo if selected
      if (logoFile) {
        formData.append("companyLogo", logoFile);
      }

      // Add application questions if any
      if (applicationQuestions.length > 0) {
        formData.append(
          "applicationQuestions",
          JSON.stringify(applicationQuestions)
        );
      }

      // Basic client-side required checks to avoid 400
      if (
        !newJob.title ||
        !newJob.description ||
        !newJob.department ||
        !newJob.location
      ) {
        throw new Error(
          "Please fill title, description, department, and location"
        );
      }
      if (!newJob.skills.trim()) {
        throw new Error("Please provide at least one required skill");
      }

      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Parse response safely (JSON if present, otherwise text)
      let data;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text };
      }

      if (!res.ok) {
        console.error("Create job failed:", res.status, data);
        throw new Error(
          data?.message || `Failed to create job (status ${res.status})`
        );
      }
      setShowModal(false);
      setFormStep(1);
      setCompanyLogo(null);
      setLogoFile(null);
      setApplicationQuestions([]);
      setNewQuestion("");
      setNewJob({
        title: "",
        company: "",
        department: "",
        location: "",
        jobType: "Full-time",
        salaryMin: "",
        salaryMax: "",
        currency: "USD",
        description: "",
        skills: "",
        experienceLevel: "Entry Level",
      });
      // refresh list
      setJobs((prev) => [data.data || data.job, ...prev]);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from list
        setJobs(jobs.filter((job) => (job._id || job.id) !== jobId));
        setMatchedJobs(
          matchedJobs.filter((job) => (job._id || job.id) !== jobId)
        );
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Error deleting job");
    }
  };

  // HR: Find matching CVs for a job using ML
  const handleFindMatchingCVs = async (job) => {
    setMatchingCVs(true);
    setMatchingJobId(job._id || job.id);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/ml/match-cvs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job._id || job.id }),
        signal: AbortSignal.timeout(90000),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const candidates = data.data || [];
        if (candidates.length > 0) {
          navigate("/hr/matched-candidates`, { state: { job, candidates } });
        } else {
          setError("⚠️ No matching CVs found for this job");
        }
      } else {
        setError(data.message || "Failed to find matching CVs");
      }
    } catch (error) {
      setError("Error: " + error.message);
    } finally {
      setMatchingCVs(false);
      setMatchingJobId(null);
    }
  };

  return (
    <div className="page-slide-up">
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Job Opportunities
            </h1>
            <p className="text-slate-400 text-lg">
              Discover your next career opportunity
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === "all"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setFilter("remote")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === "remote"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
            >
              Remote
            </button>
            <button
              onClick={() => setFilter("fulltime")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === "fulltime"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
            >
              Full-time
            </button>
            <button
              onClick={() => setFilter("saved")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === "saved"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
            >
              Saved
            </button>
            {user?.role === "employee" && (
              <button
                onClick={fetchMLMatches}
                disabled={matchLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${filter === "ai-matched"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
              >
                {matchLoading ? "Loading..." : "AI Recommendations"}
              </button>
            )}
            {user?.role === "hr" && (
              <button
                onClick={() => setShowModal(true)}
                className="ml-auto px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-all"
              >
                + Post New Job
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg font-medium">
              {error}
            </div>
          )}
          {loading && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/50 text-blue-400 rounded-lg font-medium">
              Loading jobs...
            </div>
          )}

          {/* Jobs List */}
          <div className="space-y-6">
            {(() => {
              let displayJobs = jobs;

              // Apply filters
              if (filter === "ai-matched") {
                // Filter AI matched jobs to show only 60% and above
                displayJobs = matchedJobs.filter((job) => {
                  const raw = job.matchScore ?? job.match_percentage ?? job.matchPercent;
                  const scoreNum = typeof raw === "number" ? (raw > 1 ? raw : raw * 100) : 0;
                  return scoreNum >= 60;
                });
              } else if (filter === "saved") {
                displayJobs = jobs.filter((job) =>
                  savedJobs.includes(job._id || job.id)
                );
              } else if (filter === "remote") {
                displayJobs = jobs.filter(
                  (job) =>
                    job.location &&
                    job.location.toLowerCase().includes("remote")
                );
              } else if (filter === "fulltime") {
                displayJobs = jobs.filter((job) => job.jobType === "Full-time");
              }

              // Show empty state if no jobs
              if (displayJobs.length === 0) {
                return (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-slate-600"
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
                    <p className="text-slate-400 font-semibold text-lg mb-2">
                      No jobs found
                    </p>
                    <p className="text-slate-500">
                      {filter === "saved"
                        ? "You haven't saved any jobs yet"
                        : `No ${filter} jobs available`}
                    </p>
                  </div>
                );
              }

              return displayJobs.map((job) => (
                <div
                  key={job._id || job.id}
                  className="bg-slate-800 rounded-xl hover:bg-slate-750 transition-all p-6 border border-slate-700 relative"
                >
                  {/* AI Match Percentage Badge (shows only when available) */}
                  {(filter === "ai-matched" || job.matchScore !== undefined) &&
                    (() => {
                      const raw =
                        job.matchScore ??
                        job.match_percentage ??
                        job.matchPercent;
                      // normalize: backend may send 0..1 or 0..100
                      const scoreNum =
                        typeof raw === "number"
                          ? raw > 1
                            ? raw
                            : raw * 100
                          : null;

                      if (scoreNum === null || isNaN(scoreNum)) return null;

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
                  <div className="flex items-start gap-6">
                    {/* Logo */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={`${job.company || "Company"} Logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-white"
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
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {job.title}
                          </h3>
                          <p className="text-base text-slate-400 font-medium">
                            {job.company}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-5 h-5 text-cyan-400"
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
                          <span className="font-medium">
                            {job.location || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-cyan-400"
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
                          {job.jobType || "Full-time"}
                        </div>
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {job.salary
                            ? `${job.salary.min ?? ""}${job.salary.min ? "-" : ""
                              }${job.salary.max ?? ""} ${job.salary.currency || ""
                              }`.trim()
                            : "Negotiable"}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-cyan-400"
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
                          <span className="font-medium">
                            {job.jobType || "Full-time"}
                          </span>
                        </span>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-semibold text-emerald-400">
                            {job.salaryMin && job.salaryMax
                              ? `${job.salaryMin}-${job.salaryMax} USD`
                              : job.salary
                                ? `${job.salary.min ?? ""}${job.salary.min ? "-" : ""
                                  }${job.salary.max ?? ""} ${job.salary.currency || ""
                                  }`.trim()
                                : "Negotiable"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-5 h-5 text-purple-400"
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
                          <span className="font-medium">
                            {job.posted || "Recently"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {(job.requiredSkills || job.skills || []).map(
                          (skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-slate-700 text-cyan-400 border border-slate-600 rounded-md text-sm font-semibold"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex gap-3 mt-4">
                        {user?.role === "hr" && (
                          <button
                            onClick={() => handleFindMatchingCVs(job)}
                            disabled={matchingCVs}
                            className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50"
                          >
                            {matchingCVs && matchingJobId === (job._id || job.id)
                              ? "Finding..."
                              : "Find CVs"}
                          </button>
                        )}
                        {user?.role === "employee" && (
                          <button
                            onClick={() =>
                              navigate(`/employee/jobs/${job._id || job.id}`)
                            }
                            className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all"
                          >
                            Apply Now
                          </button>
                        )}
                        <button
                          onClick={() => toggleSave(job._id || job.id)}
                          className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${savedJobs.includes(job._id || job.id)
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
                            }`}
                        >
                          {savedJobs.includes(job._id || job.id)
                            ? "Saved"
                            : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            // Open inline modal for quick details
                            setSelectedJob(job);
                            setShowDetailsModal(true);
                          }}
                          className="px-6 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-all border border-slate-600"
                        >
                          Details
                        </button>
                        {user?.role === "hr" && (
                          <button
                            onClick={() => handleDeleteJob(job._id || job.id)}
                            className="px-6 py-2.5 bg-red-900/50 text-red-400 font-semibold rounded-lg hover:bg-red-900/70 transition-all border border-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Job Details Modal */}
          {showDetailsModal && selectedJob && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 rounded-t-2xl z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-700 text-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        {selectedJob.companyLogo ? (
                          <img
                            src={selectedJob.companyLogo}
                            alt="Company Logo"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-white"
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
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-1">
                          {selectedJob.title}
                        </h2>
                        <p className="text-lg text-white/90">
                          {selectedJob.company}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-slate-700 text-white/10 rounded-lg"
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
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6 bg-slate-800">
                  {/* Key Information */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-700 p-4 rounded-xl border border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          className="w-6 h-6 text-cyan-400"
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
                        <span className="text-sm font-semibold text-slate-400">
                          Location
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {selectedJob.location || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-xl border border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          className="w-6 h-6 text-cyan-400"
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
                        <span className="text-sm font-semibold text-slate-400">
                          Job Type
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {selectedJob.jobType || "Full-time"}
                      </p>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-xl border border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          className="w-6 h-6 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm font-semibold text-slate-400">
                          Salary
                        </span>
                      </div>
                      <p className="text-lg font-bold text-emerald-400">
                        {selectedJob.salaryMin && selectedJob.salaryMax
                          ? `$${selectedJob.salaryMin}-${selectedJob.salaryMax} USD`
                          : selectedJob.salary
                            ? `${selectedJob.salary.min ?? ""}${selectedJob.salary.min ? "-" : ""
                              }${selectedJob.salary.max ?? ""} ${selectedJob.salary.currency || ""
                              }`.trim()
                            : "Negotiable"}
                      </p>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-xl border border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          className="w-6 h-6 text-orange-400"
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
                        <span className="text-sm font-semibold text-slate-400">
                          Experience
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {selectedJob.experienceLevel || "Entry Level"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedJob.description && (
                    <div className="bg-slate-700 p-6 rounded-xl border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                        <svg
                          className="w-6 h-6 text-cyan-400"
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
                        Job Description
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  {/* Department */}
                  {selectedJob.department && (
                    <div className="bg-slate-700 p-6 rounded-xl border border-slate-600">
                      <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                        <svg
                          className="w-6 h-6 text-cyan-400"
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
                        Department
                      </h3>
                      <p className="text-lg font-semibold text-white">
                        {selectedJob.department}
                      </p>
                    </div>
                  )}

                  {/* Required Skills */}
                  {(selectedJob.requiredSkills || selectedJob.skills) &&
                    (selectedJob.requiredSkills || selectedJob.skills).length >
                    0 && (
                      <div className="bg-slate-700 p-6 rounded-xl border border-slate-600">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <svg
                            className="w-6 h-6 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {(
                            selectedJob.requiredSkills || selectedJob.skills
                          ).map((skill, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-slate-600 text-cyan-400 border border-slate-500 rounded-xl text-sm font-bold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    {user?.role === "employee" && (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          navigate(
                            `/employee/jobs/${selectedJob._id || selectedJob.id
                            }`
                          );
                        }}
                        className="flex-1 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all"
                      >
                        Apply Now
                      </button>
                    )}
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-8 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-all border border-slate-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Job Modal (HR only) */}
          {showModal && user?.role === "hr" && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      Post New Job
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Step {formStep} of 2:{" "}
                      {formStep === 1 ? "Job Details" : "Application Questions"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setFormStep(1);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
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
                </div>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  {/* Step 1: Job Details */}
                  {formStep === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Job Title *
                        </label>
                        <input
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400"
                          placeholder="e.g. Senior Frontend Developer"
                          value={newJob.title}
                          onChange={(e) =>
                            setNewJob({ ...newJob, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Company *
                        </label>
                        <input
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400"
                          placeholder="e.g. TechCorp"
                          value={newJob.company}
                          onChange={(e) =>
                            setNewJob({ ...newJob, company: e.target.value })
                          }
                          required
                        />
                      </div>

                      {/* Company Logo Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Company Logo
                        </label>
                        <div className="flex items-center gap-4">
                          {companyLogo && (
                            <img
                              src={companyLogo}
                              alt="Company Logo Preview"
                              className="w-24 h-24 rounded-lg object-cover border-2 border-slate-600"
                            />
                          )}
                          <label className="flex-1 cursor-pointer">
                            <div className="w-full border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-cyan-500 transition-all bg-slate-700">
                              <svg
                                className="w-8 h-8 mx-auto mb-2 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-sm text-slate-300">
                                {logoFile
                                  ? logoFile.name
                                  : "Click to upload company logo"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    setError(
                                      "Image size should be less than 5MB"
                                    );
                                    return;
                                  }
                                  if (!file.type.startsWith("image/")) {
                                    setError("Please select an image file");
                                    return;
                                  }
                                  setLogoFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCompanyLogo(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {companyLogo && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompanyLogo(null);
                                setLogoFile(null);
                              }}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Department *
                          </label>
                          <input
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                            placeholder="e.g. Engineering"
                            value={newJob.department}
                            onChange={(e) =>
                              setNewJob({
                                ...newJob,
                                department: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Location *
                          </label>
                          <input
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                            placeholder="e.g. Remote / NYC"
                            value={newJob.location}
                            onChange={(e) =>
                              setNewJob({ ...newJob, location: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Job Type
                        </label>
                        <select
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-slate-700 text-white"
                          value={newJob.jobType}
                          onChange={(e) =>
                            setNewJob({ ...newJob, jobType: e.target.value })
                          }
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Remote</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Salary Range
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                            placeholder="Min"
                            type="number"
                            value={newJob.salaryMin}
                            onChange={(e) =>
                              setNewJob({
                                ...newJob,
                                salaryMin: e.target.value,
                              })
                            }
                          />
                          <input
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                            placeholder="Max"
                            type="number"
                            value={newJob.salaryMax}
                            onChange={(e) =>
                              setNewJob({
                                ...newJob,
                                salaryMax: e.target.value,
                              })
                            }
                          />
                          <select
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-slate-700 text-white"
                            value={newJob.currency}
                            onChange={(e) =>
                              setNewJob({ ...newJob, currency: e.target.value })
                            }
                          >
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                            <option>EGP</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Job Description *
                        </label>
                        <textarea
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                          placeholder="Describe the role, responsibilities, and requirements..."
                          rows={5}
                          value={newJob.description}
                          onChange={(e) =>
                            setNewJob({
                              ...newJob,
                              description: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Required Skills * (comma-separated)
                        </label>
                        <input
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                          placeholder="e.g. React, Node.js, MongoDB, REST APIs"
                          value={newJob.skills}
                          onChange={(e) =>
                            setNewJob({ ...newJob, skills: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Experience Level
                        </label>
                        <select
                          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-slate-700 text-white"
                          value={newJob.experienceLevel}
                          onChange={(e) =>
                            setNewJob({
                              ...newJob,
                              experienceLevel: e.target.value,
                            })
                          }
                        >
                          <option>Entry Level</option>
                          <option>Mid Level</option>
                          <option>Senior Level</option>
                          <option>Executive</option>
                        </select>
                      </div>
                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            setFormStep(1);
                          }}
                          className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Validate step 1 fields
                            if (
                              !newJob.title ||
                              !newJob.company ||
                              !newJob.department ||
                              !newJob.location ||
                              !newJob.description ||
                              !newJob.skills.trim()
                            ) {
                              setError(
                                "Please fill all required fields before proceeding"
                              );
                              return;
                            }
                            setError(null);
                            setFormStep(2);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md"
                        >
                          Next{" "}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Application Questions */}
                  {formStep === 2 && (
                    <>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            Application Questions
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Add questions that candidates will answer when they
                            apply for this position.
                          </p>
                        </div>

                        {/* Current Questions List */}
                        {applicationQuestions.length > 0 && (
                          <div className="space-y-3 mb-4">
                            <p className="text-sm font-semibold text-gray-700">
                              Questions ({applicationQuestions.length}):
                            </p>
                            {applicationQuestions.map((q, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                                  {idx + 1}
                                </span>
                                <p className="flex-1 text-gray-800">{q}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApplicationQuestions(
                                      applicationQuestions.filter(
                                        (_, i) => i !== idx
                                      )
                                    );
                                  }}
                                  className="flex-shrink-0 text-red-500 hover:text-red-400 transition-colors"
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Question */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Add Question
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                              placeholder="e.g. What interests you about this position?"
                              value={newQuestion}
                              onChange={(e) => setNewQuestion(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newQuestion.trim()) {
                                    setApplicationQuestions([
                                      ...applicationQuestions,
                                      newQuestion.trim(),
                                    ]);
                                    setNewQuestion("");
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newQuestion.trim()) {
                                  setApplicationQuestions([
                                    ...applicationQuestions,
                                    newQuestion.trim(),
                                  ]);
                                  setNewQuestion("");
                                }
                              }}
                              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md"
                            >
                              + Add
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Questions are optional. Press Enter or click Add to
                            include a question.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                        >
                          Post Job
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
