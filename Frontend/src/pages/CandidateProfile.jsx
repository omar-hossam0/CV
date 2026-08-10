import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function CandidateProfile() {
    const { candidateId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const jobId = location.state?.jobId; // Get jobId from navigation state
    const [candidate, setCandidate] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedJobApplication, setSelectedJobApplication] = useState(null);

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const res = await fetch(`http://localhost:5000/api/candidates/${candidateId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || "Failed to load candidate");

                setCandidate(data.data);

                // If jobId is provided, find the specific application and fetch the job
                if (jobId && data.data?.applications?.length > 0) {
                    const application = data.data.applications.find(
                        app => app.jobId?._id === jobId || app.jobId === jobId
                    );
                    if (application) {
                        setSelectedJobApplication(application);

                        // Fetch job details to get questions
                        const jobRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const jobData = await jobRes.json();
                        if (jobRes.ok) {
                            setJob(jobData.data || jobData.job);
                        }
                    }
                } else if (data.data?.applications?.length > 0) {
                    // Default to most recent application
                    setSelectedJobApplication(data.data.applications[0]);
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (candidateId) {
            fetchCandidate();
        }
    }, [candidateId, jobId]);

    const downloadCV = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/candidates/${candidateId}/resume`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${candidate.name}_CV.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Failed to download CV");
            }
        } catch (error) {
            console.error("Error downloading CV:", error);
            alert("Error downloading CV");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-red-600 mb-4">{error || "Candidate not found"}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 sticky top-8">
                            {/* Profile Picture */}
                            <div className="text-center mb-6">
                                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-5xl mb-4">
                                    {candidate.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                                {candidate.jobTitle && (
                                    <p className="text-gray-600 font-medium mt-1">{candidate.jobTitle}</p>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">{candidate.email}</span>
                                </div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-sm">{candidate.phone}</span>
                                    </div>
                                )}
                                {candidate.location && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <span className="text-sm">{candidate.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-indigo-600">{candidate.experience || 0}</p>
                                    <p className="text-xs text-gray-600">Years Exp.</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{candidate.skills?.length || 0}</p>
                                    <p className="text-xs text-gray-600">Skills</p>
                                </div>
                            </div>

                            {/* CV Download Button */}
                            {candidate.resumeUrl && (
                                <button
                                    onClick={downloadCV}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download CV
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Application Answers */}
                        {selectedJobApplication?.answers && Object.keys(selectedJobApplication.answers).length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Application Answers
                                    {selectedJobApplication.jobId?.title && (
                                        <span className="text-sm font-normal text-gray-600">
                                            - {selectedJobApplication.jobId.title}
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(selectedJobApplication.answers).map(([questionIdx, answer]) => {
                                        const question = job?.applicationQuestions?.[parseInt(questionIdx)];
                                        return (
                                            <div key={questionIdx} className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                                <p className="text-sm font-bold text-indigo-600 mb-2">
                                                    {question || `Question ${parseInt(questionIdx) + 1}`}
                                                </p>
                                                <p className="text-gray-800 font-medium">{answer}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 border-2 border-indigo-200 rounded-lg text-sm font-semibold"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {(candidate.university || candidate.degree) && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    </svg>
                                    Education
                                </h3>
                                <div className="space-y-2">
                                    {candidate.degree && (
                                        <p className="text-gray-800">
                                            <span className="font-semibold">Degree:</span> {candidate.degree}
                                        </p>
                                    )}
                                    {candidate.university && (
                                        <p className="text-gray-800">
                                            <span className="font-semibold">University:</span> {candidate.university}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Experience Level */}
                        {candidate.experienceLevel && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Experience Level
                                </h3>
                                <p className="text-gray-800 text-lg">{candidate.experienceLevel}</p>
                            </div>
                        )}

                        {/* CV Text Preview */}
                        {candidate.resumeText && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CV Preview
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                        {candidate.resumeText}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
