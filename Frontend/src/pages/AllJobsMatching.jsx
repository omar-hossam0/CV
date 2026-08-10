import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

export default function AllJobsMatching() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [matchedCandidates, setMatchedCandidates] = useState({});
    const [loadingMatches, setLoadingMatches] = useState({});
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [expandedJob, setExpandedJob] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
            navigate("/login");
            return;
        }

        const userData = JSON.parse(storedUser);
        if (userData.role !== "hr") {
            navigate("/employee/dashboard");
            return;
        }

        setUser(userData);
        fetchAllJobs(token);
    }, [navigate]);

    const fetchAllJobs = async (token) => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/jobs", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setJobs(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            showToast("Error fetching jobs", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const fetchMatchingCVs = async (job) => {
        if (matchedCandidates[job._id]) {
            // Toggle expand/collapse if already loaded
            setExpandedJob(expandedJob === job._id ? null : job._id);
            return;
        }

        setLoadingMatches((prev) => ({ ...prev, [job._id]: true }));
        setExpandedJob(job._id);

        try {
            const token = localStorage.getItem("token");
            console.log("🎯 Finding matching CVs for job:", job.title);

            const response = await fetch("http://localhost:5000/api/ml/match-cvs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ jobId: job._id }),
                signal: AbortSignal.timeout(90000),
            });

            const data = await response.json();
            console.log("📥 Matched CVs response:", data);

            if (response.ok && data.success) {
                const candidates = data.data || [];
                setMatchedCandidates((prev) => ({
                    ...prev,
                    [job._id]: candidates,
                }));
            } else {
                showToast(data.message || "Failed to find matching CVs", "error");
                setMatchedCandidates((prev) => ({
                    ...prev,
                    [job._id]: [],
                }));
            }
        } catch (error) {
            console.error("❌ Error finding matching CVs:", error);
            if (error.name === "AbortError") {
                showToast("⏱️ Request timed out", "error");
            } else {
                showToast("Error: " + error.message, "error");
            }
            setMatchedCandidates((prev) => ({
                ...prev,
                [job._id]: [],
            }));
        } finally {
            setLoadingMatches((prev) => ({ ...prev, [job._id]: false }));
        }
    };

    const getMatchScoreColor = (score) => {
        if (score >= 80) return "from-green-500 to-emerald-600";
        if (score >= 60) return "from-yellow-500 to-orange-500";
        return "from-red-500 to-pink-500";
    };

    const getMatchScoreBg = (score) => {
        if (score >= 80) return "bg-green-100 text-green-700";
        if (score >= 60) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-300 font-semibold">Loading Jobs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: "", type: "" })}
                />
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate("/hr/dashboard")}
                        className="mb-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center gap-2 text-white"
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
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Dashboard
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <svg
                                    className="w-12 h-12"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    />
                                </svg>
                                All Jobs - CV Matching
                            </h1>
                            <p className="text-white/90 text-lg">
                                View all job posts and find matching CVs for each position
                            </p>
                            <p className="text-white/70 mt-1">
                                {jobs.length} {jobs.length === 1 ? "job" : "jobs"} posted
                            </p>
                        </div>

                        <div className="hidden md:flex items-center gap-4 bg-white/10 rounded-2xl p-4">
                            <div className="text-center px-4 border-r border-white/20">
                                <p className="text-3xl font-bold text-white">{jobs.length}</p>
                                <p className="text-sm text-white/70">Total Jobs</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-3xl font-bold text-cyan-300">
                                    {Object.values(matchedCandidates).flat().length}
                                </p>
                                <p className="text-sm text-white/70">CVs Analyzed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {jobs.length === 0 ? (
                    <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
                        <svg
                            className="w-20 h-20 mx-auto mb-4 text-slate-600"
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
                        <h3 className="text-2xl font-bold text-white mb-2">
                            No Jobs Posted Yet
                        </h3>
                        <p className="text-slate-400 mb-6">
                            Post your first job to start matching CVs
                        </p>
                        <button
                            onClick={() => navigate("/hr/jobs")}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
                        >
                            Post a Job
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {jobs.map((job) => (
                            <div
                                key={job._id}
                                className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all"
                            >
                                {/* Job Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            {/* Company Logo */}
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {job.companyLogo ? (
                                                    <img
                                                        src={`http://localhost:5000${job.companyLogo}`}
                                                        alt={job.company}
                                                        className="w-full h-full object-cover"
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

                                            {/* Job Info */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {job.title}
                                                </h3>
                                                <p className="text-slate-400 mb-3">
                                                    {job.company || "Company Name"}
                                                </p>

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {job.skills?.slice(0, 4).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-slate-700 text-cyan-400 rounded-full text-xs font-medium"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {job.skills?.length > 4 && (
                                                        <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-medium">
                                                            +{job.skills.length - 4} more
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Job Meta */}
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
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
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                        {job.location || "Location Not Set"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4 text-purple-400"
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
                                                        {job.jobType || "Full-time"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4 text-pink-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                        {job.applicationsCount || 0} Applied
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => fetchMatchingCVs(job)}
                                            disabled={loadingMatches[job._id]}
                                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${expandedJob === job._id && matchedCandidates[job._id]
                                                    ? "bg-slate-700 text-white"
                                                    : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                                                }`}
                                        >
                                            {loadingMatches[job._id] ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    Analyzing...
                                                </>
                                            ) : expandedJob === job._id &&
                                                matchedCandidates[job._id] ? (
                                                <>
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
                                                            d="M5 15l7-7 7 7"
                                                        />
                                                    </svg>
                                                    Hide Results
                                                </>
                                            ) : matchedCandidates[job._id] ? (
                                                <>
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
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                    Show Results ({matchedCandidates[job._id].length})
                                                </>
                                            ) : (
                                                <>
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
                                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                        />
                                                    </svg>
                                                    Find Matching CVs
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Job Description Preview */}
                                    {job.description && (
                                        <div className="mt-4 p-4 bg-slate-700/50 rounded-xl">
                                            <p className="text-sm text-slate-300 line-clamp-2">
                                                {job.description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Matched Candidates Section */}
                                {expandedJob === job._id && matchedCandidates[job._id] && (
                                    <div className="border-t border-slate-700 bg-slate-850">
                                        {/* Summary Stats */}
                                        <div className="p-4 bg-slate-700/30 border-b border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
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
                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    Matching CVs Found: {matchedCandidates[job._id].length}
                                                </h4>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                        <span className="text-sm text-slate-400">
                                                            Excellent (80%+):{" "}
                                                            {
                                                                matchedCandidates[job._id].filter(
                                                                    (c) => c.matchScore >= 80
                                                                ).length
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                        <span className="text-sm text-slate-400">
                                                            Good (60-80%):{" "}
                                                            {
                                                                matchedCandidates[job._id].filter(
                                                                    (c) =>
                                                                        c.matchScore >= 60 && c.matchScore < 80
                                                                ).length
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                        <span className="text-sm text-slate-400">
                                                            Fair (&lt;60%):{" "}
                                                            {
                                                                matchedCandidates[job._id].filter(
                                                                    (c) => c.matchScore < 60
                                                                ).length
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Candidates List */}
                                        {matchedCandidates[job._id].length === 0 ? (
                                            <div className="p-8 text-center">
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
                                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <p className="text-slate-400">
                                                    No matching candidates found for this job
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                                {matchedCandidates[job._id].map((candidate, index) => (
                                                    <div
                                                        key={candidate._id}
                                                        className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-all border border-slate-600 hover:border-cyan-500/50"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {/* Rank */}
                                                            <div
                                                                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br ${getMatchScoreColor(
                                                                    candidate.matchScore
                                                                )}`}
                                                            >
                                                                #{index + 1}
                                                            </div>

                                                            {/* Candidate Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-bold text-white truncate">
                                                                    {candidate.name}
                                                                </h5>
                                                                <p className="text-sm text-slate-400 truncate">
                                                                    {candidate.email}
                                                                </p>
                                                                {candidate.skills &&
                                                                    candidate.skills.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {candidate.skills
                                                                                .slice(0, 3)
                                                                                .map((skill, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className="px-2 py-0.5 bg-slate-600 text-cyan-300 rounded text-xs"
                                                                                    >
                                                                                        {skill}
                                                                                    </span>
                                                                                ))}
                                                                            {candidate.skills.length > 3 && (
                                                                                <span className="px-2 py-0.5 bg-slate-600 text-slate-400 rounded text-xs">
                                                                                    +{candidate.skills.length - 3}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            {/* Match Score */}
                                                            <div className="flex-shrink-0 text-center">
                                                                <div
                                                                    className={`px-4 py-2 rounded-xl font-bold text-lg ${getMatchScoreBg(
                                                                        candidate.matchScore
                                                                    )}`}
                                                                >
                                                                    {candidate.matchScore.toFixed(1)}%
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-1">
                                                                    Match Score
                                                                </p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex-shrink-0 flex gap-2">
                                                                <a
                                                                    href={`mailto:${candidate.email}`}
                                                                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition"
                                                                    title="Send Email"
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
                                                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                </a>
                                                                {candidate.phone && (
                                                                    <a
                                                                        href={`tel:${candidate.phone}`}
                                                                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                                                                        title="Call"
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
                                                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                                            />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                                <button
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/hr/candidates/${candidate._id}`
                                                                        )
                                                                    }
                                                                    className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
                                                                    title="View Profile"
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
                                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* CV Preview */}
                                                        {candidate.resumeText && (
                                                            <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                                                                <p className="text-xs text-slate-500 mb-1">
                                                                    CV Preview:
                                                                </p>
                                                                <p className="text-sm text-slate-300 line-clamp-2">
                                                                    {candidate.resumeText}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* View Full Results Button */}
                                        {matchedCandidates[job._id].length > 0 && (
                                            <div className="p-4 border-t border-slate-700">
                                                <button
                                                    onClick={() =>
                                                        navigate("/hr/matched-candidates", {
                                                            state: {
                                                                job,
                                                                candidates: matchedCandidates[job._id],
                                                            },
                                                        })
                                                    }
                                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
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
                                                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                                        />
                                                    </svg>
                                                    View Full Analysis
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
