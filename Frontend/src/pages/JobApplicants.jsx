import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api.js";

export default function JobApplicants() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobAndApplicants = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                // Fetch job details
                const jobRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const jobData = await jobRes.json();
                if (!jobRes.ok) throw new Error(jobData?.message || "Failed to load job");
                setJob(jobData.data || jobData.job);

                // Fetch applicants
                const applicantsRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applicants`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const applicantsData = await applicantsRes.json();
                if (!applicantsRes.ok) throw new Error(applicantsData?.message || "Failed to load applicants");
                setApplicants(applicantsData.data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobAndApplicants();
        }
    }, [jobId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading applicants...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/hr/jobs")}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Jobs
                </button>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Job Header */}
                {job && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                        <p className="text-gray-600">{job.company}</p>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {job.jobType}
                            </span>
                        </div>
                    </div>
                )}

                {/* Applicants List */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Applicants ({applicants.length})
                    </h2>

                    {applicants.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-500 font-medium">No applicants yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applicants.map((applicant) => (
                                <div
                                    key={applicant._id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => navigate(`/hr/candidates/${applicant._id}`, { state: { jobId } })}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                                {applicant.name?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {applicant.name}
                                            </h3>
                                            <p className="text-gray-600 mb-2">{applicant.email}</p>
                                            {applicant.jobTitle && (
                                                <p className="text-sm text-gray-500 mb-2">
                                                    <span className="font-semibold">Position:</span> {applicant.jobTitle}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {applicant.skills?.slice(0, 5).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {applicant.skills?.length > 5 && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                                                        +{applicant.skills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                                                </span>
                                                {applicant.experienceLevel && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {applicant.experienceLevel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all">
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
