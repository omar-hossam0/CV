import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function MatchedCandidates() {
  const navigate = useNavigate();
  const location = useLocation();
  const { job, candidates } = location.state || {};

  useEffect(() => {
    // Redirect if no data
    if (!job || !candidates) {
      navigate("/hr/dashboard");
    }
  }, [job, candidates, navigate]);

  if (!job || !candidates) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <button
            onClick={() => navigate("/hr/dashboard")}
            className="mb-4 px-4 py-2 bg-slate-800 border border-slate-700/20 hover:bg-slate-800 border border-slate-700/30 rounded-lg transition-all flex items-center gap-2"
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
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                AI Matched Candidates
              </h1>
              <p className="text-xl text-white/90">
                Best matching CVs for:{" "}
                <span className="font-bold underline">{job.title}</span>
              </p>
              <p className="text-white/80 mt-2">
                {candidates.length}{" "}
                {candidates.length === 1 ? "candidate" : "candidates"} found
              </p>
            </div>
            <svg
              className="hidden md:block w-20 h-20"
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

        {/* AI Analysis Summary */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border-l-4 border-cyan-500">
          <div className="flex items-start gap-3">
            <svg
              className="w-10 h-10 text-cyan-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                AI Analysis Summary
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Our AI system analyzed{" "}
                <span className="font-bold text-cyan-400">
                  {candidates.length} candidate CVs
                </span>{" "}
                using
                <span className="font-semibold">
                  {" "}
                  BERT semantic similarity
                </span>{" "}
                combined with
                <span className="font-semibold">
                  {" "}
                  technical keyword matching
                </span>
                . Scores represent the relevance of each candidate's experience
                and skills to your job requirements.
              </p>
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/50">
                  <div className="text-sm text-slate-300 font-semibold">
                    Excellent Matches (80%+)
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {candidates.filter((c) => c.matchScore >= 80).length}
                  </div>
                </div>
                <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/50">
                  <div className="text-sm text-slate-300 font-semibold">
                    Good Matches (60-80%)
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {
                      candidates.filter(
                        (c) => c.matchScore >= 60 && c.matchScore < 80
                      ).length
                    }
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <div className="text-sm text-slate-300 font-semibold">
                    Fair Matches (60%+)
                  </div>
                  <div className="text-2xl font-bold text-slate-300">
                    {candidates.filter((c) => c.matchScore >= 60).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Job Requirements
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-slate-300">Department:</span>
              <span className="ml-2 text-slate-400">
                {job.department || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-300">Location:</span>
              <span className="ml-2 text-slate-400">
                {job.location || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-300">
                Experience Level:
              </span>
              <span className="ml-2 text-slate-400">
                {job.experienceLevel || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-300">Job Type:</span>
              <span className="ml-2 text-slate-400">
                {job.jobType || "N/A"}
              </span>
            </div>
          </div>
          {job.description && (
            <div className="mt-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <p className="text-xs font-semibold text-cyan-400 mb-2">
                Description:
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {job.description}
              </p>
            </div>
          )}
        </div>

        {/* Candidates List */}
        <div className="space-y-6">
          {candidates.map((candidate, index) => (
            <div
              key={candidate._id}
              className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4"
              style={{
                borderLeftColor:
                  candidate.matchScore >= 80
                    ? "#10b981"
                    : candidate.matchScore >= 60
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div
                  className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${index === 0
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"
                    : index === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-500"
                      : index === 2
                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                        : "bg-gradient-to-br from-purple-500 to-pink-500"
                    }`}
                >
                  #{index + 1}
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  {/* Name & Contact */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {candidate.name}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-1">
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
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {candidate.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-slate-300">
                        Match Score:
                      </span>
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-bold ${candidate.matchScore >= 80
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : candidate.matchScore >= 60
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                      >
                        {candidate.matchScore.toFixed(1)}% -{" "}
                        {candidate.matchScore >= 80
                          ? "Excellent Match"
                          : candidate.matchScore >= 60
                            ? "Fair Match"
                            : "Low Match"}
                      </span>
                    </div>
                    <div className="relative w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${candidate.matchScore >= 80
                          ? "bg-gradient-to-r from-green-500 to-emerald-600"
                          : candidate.matchScore >= 60
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-pink-500"
                          }`}
                        style={{ width: `${candidate.matchScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skills */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-300 mb-2">
                        Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-slate-700 text-cyan-400 rounded-lg text-sm font-medium border border-slate-600 hover:border-cyan-500/50 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience & Education */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    {candidate.experience && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"
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
                          <span className="font-semibold text-slate-300">
                            Experience:
                          </span>
                          <p className="text-slate-400">
                            {candidate.experience}
                          </p>
                        </div>
                      </div>
                    )}
                    {candidate.education && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          />
                        </svg>
                        <div>
                          <span className="font-semibold text-slate-300">
                            Education:
                          </span>
                          <p className="text-slate-400">
                            {candidate.education}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CV Preview */}
                  {candidate.resumeText && (
                    <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 mb-4">
                      <p className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        CV Preview:
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {candidate.resumeText}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2"
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
                      Contact Candidate
                    </a>
                    {candidate.phone && (
                      <a
                        href={`tel:${candidate.phone}`}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-md flex items-center gap-2"
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
                        Call
                      </a>
                    )}
                    <button
                      onClick={() =>
                        navigate(`/hr/candidates/${candidate._id}`, {
                          state: { candidate },
                        })
                      }
                      className="px-6 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl font-semibold hover:bg-purple-500/30 transition-all flex items-center gap-2"
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
                      View Full Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {candidates.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-gray-400"
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
            <h3 className="text-2xl font-bold text-white mb-2">
              No Matching Candidates Found
            </h3>
            <p className="text-slate-400">
              Try adjusting your job requirements or check back later for new
              candidates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
