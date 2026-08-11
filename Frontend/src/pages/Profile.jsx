import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { API_BASE_URL } from "../utils/api.js";

export default function Profile() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [hasUploadedCV, setHasUploadedCV] = useState(false);
  const [cvFileName, setCvFileName] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    university: "",
    degree: "",
    skills: [],
    experience: 0,
    experienceLevel: "Entry Level",
    jobTitle: "",
  });
  const fetchedOnceRef = useRef(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    // Load profile data from user
    setProfile({
      name: userData.name || "",
      email: userData.email || "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
      university: "",
      degree: "",
      skills: [],
      experience: 0,
      experienceLevel: "Entry Level",
    });

    // Fetch candidate profile if exists (avoid duplicate call in StrictMode dev)
    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true;
      fetchCandidateProfile(token, userData.email);
      fetchSavedJobs(token);
    }
  }, [navigate]);

  const fetchSavedJobs = async (token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/candidates/saved-jobs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data.data || []);
        console.log("� Loaded saved jobs:", data.data?.length || 0);
      }
    } catch (error) {
      console.error("⚠️ Error fetching saved jobs:", error);
    }
  };

  const fetchCandidateProfile = async (token, email) => {
    try {
      console.log("Fetching candidate profile...");

      // Use /me endpoint for employees to get their own profile
      const response = await fetch(`${API_BASE_URL}/api/candidates/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Profile response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Profile data:", data);

        if (data.data) {
          const candidateData = data.data;
          setProfile((prev) => ({
            ...prev,
            phone: candidateData.phone || "",
            location: candidateData.location || "",
            linkedin: candidateData.linkedinUrl || "",
            portfolio: candidateData.portfolioUrl || "",
            university: candidateData.university || "",
            degree: candidateData.degree || "",
            skills: candidateData.skills || [],
            experience: candidateData.experience || 0,
            experienceLevel: candidateData.experienceLevel || "Entry Level",
            jobTitle: candidateData.jobTitle || "",
          }));

          // Load saved classification result if exists
          if (
            candidateData.classificationResult &&
            candidateData.classificationResult.jobTitle
          ) {
            setClassificationResult({
              jobTitle: candidateData.classificationResult.jobTitle,
              confidence: candidateData.classificationResult.confidence,
              decision_method: candidateData.classificationResult.method,
              classifiedAt: candidateData.classificationResult.classifiedAt,
            });
            console.log(
              "� Loaded saved classification result:",
              candidateData.classificationResult
            );
          }

          // Check if CV has been uploaded
          if (
            candidateData.resumeUrl &&
            candidateData.resumeUrl.trim() !== ""
          ) {
            setHasUploadedCV(true);
            setCvFileName("CV uploaded successfully");
            console.log(
              "� CV already uploaded, resumeUrl:",
              candidateData.resumeUrl
            );
          } else {
            setHasUploadedCV(false);
            console.log("ℹ️ No CV uploaded yet");
          }

          console.log("� Profile loaded successfully");
        } else {
          console.log("ℹ️ No profile found yet");
        }
      } else {
        console.error("❌ Failed to fetch profile:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    try {
      setUploading(true);

      const candidateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        university: profile.university,
        degree: profile.degree,
        skills: profile.skills,
        experience: profile.experience,
        experienceLevel: profile.experienceLevel,
        linkedinUrl: profile.linkedin,
        portfolioUrl: profile.portfolio,
        location: profile.location,
        availability: "Immediate",
      };

      const response = await fetch(`${API_BASE_URL}/api/candidates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidateData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Profile saved successfully!", "success");
        setEditing(false);
      } else {
        showToast(`Error: ${data.message}`, "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size must be less than 10MB", "error");
        return;
      }

      // Server currently accepts PDF only (we extract text from PDF)
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        showToast("Only PDF files are allowed", "error");
        return;
      }

      // Clear old classification immediately when selecting new CV
      setClassificationResult(null);

      setCvFile(file);
      showToast(
        `CV file "${file.name}" selected! Click "Upload CV" to save.`,
        "info"
      );
    }
  };

  const handleCVSubmit = async () => {
    console.log("handleCVSubmit called!");

    if (!cvFile) {
      console.log("❌ No file selected");
      showToast("Please select a CV file first", "error");
      return;
    }

    const token = localStorage.getItem("token");

    console.log("Starting CV upload...");
    console.log("File:", cvFile.name, cvFile.type, cvFile.size, "bytes");
    console.log("Token:", token ? "EXISTS" : "MISSING");

    if (!token) {
      console.error("❌ No token found! User not logged in.");
      showToast(
        "You must be logged in to upload CV. Please login again.",
        "error"
      );
      return;
    }

    try {
      setUploading(true);

      // Clear old classification result immediately when uploading new CV
      setClassificationResult(null);

      const formData = new FormData();
      formData.append("cv", cvFile);

      console.log(
        "Sending request to backend...",
        "URL:",
        `${API_BASE_URL}/api/candidates/upload`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/candidates/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      console.log("Response received!");
      console.log("Response status:", response.status, response.statusText);

      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (response.ok) {
        // Update profile with extracted fields and classification
        if (data.data && data.data.candidate) {
          const extracted = data.data.candidate;
          setProfile((prev) => ({
            ...prev,
            skills: extracted.skills || prev.skills,
            experience: extracted.experience || prev.experience,
            university: extracted.university || prev.university,
            degree: extracted.degree || prev.degree,
            phone: extracted.phone || prev.phone,
            jobTitle: extracted.jobTitle || prev.jobTitle,
            resumeExtract: data.data.resumeText || "",
          }));
        }

        // Check if auto-classification happened
        if (data.data.classification) {
          const cls = data.data.classification;
          setClassificationResult({
            jobTitle: cls.jobTitle,
            confidence: cls.confidence,
            decision_method: cls.method,
          });
          showToast(
            `CV uploaded & classified as ${cls.jobTitle} (${(
              cls.confidence * 100
            ).toFixed(1)}%)`,
            "success"
          );
        } else {
          showToast(
            "CV uploaded successfully! Fields auto-extracted.",
            "success"
          );
        }

        // Clear file selection
        setCvFile(null);

        // Set CV uploaded state
        setHasUploadedCV(true);
        setCvFileName(cvFile.name);

        // Refresh candidate profile from server
        fetchCandidateProfile(token, user.email);
      } else {
        console.error("❌ Upload failed:", data.message);
        showToast(`Upload error: ${data.message || "Server error"}`, "error");
      }
      setUploading(false);
    } catch (error) {
      console.error("❌ Upload error:", error);
      showToast("Upload failed. Please try again.", "error");
      setUploading(false);
    }
  };

  const handleAddSkill = () => {
    const skill = prompt("Enter a new skill:");
    if (skill && skill.trim()) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
    }
  };

  const handleRemoveSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleClassifyCV = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("Please login first", "error");
      return;
    }

    if (!hasUploadedCV) {
      showToast("Please upload your CV first before classification", "error");
      return;
    }

    try {
      setClassifying(true);
      console.log("Starting CV classification...");

      const response = await fetch(`${API_BASE_URL}/api/ml/classify-cv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Classification result:", data);

      if (response.ok && data.success) {
        const classificationData = {
          jobTitle: data.data.jobTitle,
          confidence: data.data.confidence,
          decision_method: data.data.decision_method,
        };

        setClassificationResult(classificationData);
        showToast(
          `Classification Complete! Job Title: ${data.data.jobTitle} (${(
            data.data.confidence * 100
          ).toFixed(1)}%)`,
          "success"
        );

        // Update profile with job title
        setProfile((prev) => ({
          ...prev,
          jobTitle: data.data.jobTitle,
        }));

        console.log(
          "Classification result saved to database and will persist on refresh"
        );
      } else {
        throw new Error(data.message || "Classification failed");
      }
    } catch (error) {
      console.error("❌ Classification error:", error);
      showToast(`Classification failed: ${error.message}`, "error");
    } finally {
      setClassifying(false);
    }
  };

  const savedCourses = [
    { id: 1, title: "Advanced Docker & Kubernetes", progress: 0 },
    { id: 2, title: "AWS Cloud Practitioner", progress: 0 },
    { id: 3, title: "Advanced TypeScript", progress: 45 },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 page-fade">
          <h1 className="text-5xl font-extrabold text-white mb-3 drop-shadow-2xl">
            Profile
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">
                  Personal Information
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-full hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-full hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-6 py-3 bg-slate-700 text-slate-300 font-bold rounded-full hover:bg-slate-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Resume extracted text preview */}
            {profile.resumeExtract && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-6 border-2 border-slate-600">
                <h3 className="text-xl font-bold mb-3 text-white drop-shadow-md">
                  Extracted CV Text (preview)
                </h3>
                <div className="max-h-48 overflow-auto text-base text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-lg">
                  {profile.resumeExtract}
                </div>
              </div>
            )}

            {/* Links Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
              <h2 className="text-3xl font-extrabold text-white mb-6 drop-shadow-lg">
                Professional Links
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    LinkedIn
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) =>
                        setProfile({ ...profile, linkedin: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <a
                      href={`https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                    >
                      {profile.linkedin}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    GitHub
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.github}
                      onChange={(e) =>
                        setProfile({ ...profile, github: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400 font-medium"
                    />
                  ) : (
                    <a
                      href={`https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                    >
                      {profile.github}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                    Portfolio
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.portfolio}
                      onChange={(e) =>
                        setProfile({ ...profile, portfolio: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all"
                    />
                  ) : (
                    <a
                      href={`https://${profile.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                    >
                      {profile.portfolio}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
              <h2 className="text-3xl font-extrabold text-white mb-6 drop-shadow-lg">
                CV / Resume
              </h2>

              {user.role !== "employee" ? (
                <p className="text-slate-300 font-medium text-lg">
                  CV upload is for employees only.
                </p>
              ) : hasUploadedCV && !cvFile ? (
                // Show uploaded CV status with Edit button
                <div className="space-y-4">
                  <div className="border-4 border-solid border-green-500 rounded-xl p-8 bg-green-900/20 border-green-500/50">
                    <div className="text-center">
                      <svg
                        className="w-20 h-20 mx-auto mb-4 text-green-600"
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
                      <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                        CV Uploaded Successfully
                      </h3>
                      <p className="text-slate-300 font-medium mb-4 font-semibold">
                        {cvFileName}
                      </p>
                      <p className="text-sm text-slate-400 mb-6">
                        Your CV has been uploaded and processed.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => {
                            setHasUploadedCV(false);
                            setCvFileName("");
                            // Clear old classification when clicking Edit/Change CV
                            setClassificationResult(null);
                          }}
                          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all"
                        >
                          Edit / Change CV
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show classification result if available */}
                  {classificationResult && (
                    <div className="space-y-4">
                      <div className="border-4 border-solid border-purple-500 rounded-xl p-6 bg-purple-900/20 border-purple-500/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-purple-300">
                            Auto-Classification Result
                          </h4>
                          {classificationResult.classifiedAt && (
                            <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-semibold">
                              Saved
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-300 mb-1">
                              Job Title:
                            </p>
                            <p className="text-xl font-bold text-purple-200">
                              {classificationResult.jobTitle}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-purple-300 bg-purple-800/50 p-2 rounded">
                          Method:{" "}
                          {classificationResult.decision_method || "unknown"}
                        </div>
                        {classificationResult.classifiedAt && (
                          <div className="text-xs text-slate-500 mt-2">
                            Classified:{" "}
                            {new Date(
                              classificationResult.classifiedAt
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* AI Analysis Details */}
                      {classificationResult.ai_analysis && (
                        <div className="border-4 border-solid border-blue-500 rounded-xl p-6 bg-blue-900/20 border-blue-500/50">
                          <h4 className="text-lg font-bold text-blue-300 mb-4">
                            AI Analysis
                          </h4>

                          {classificationResult.ai_analysis.primary_role && (
                            <div className="mb-4">
                              <p className="text-sm text-slate-300 font-medium font-semibold mb-1">
                                Primary Role:
                              </p>
                              <p className="text-blue-200 text-lg font-semibold">
                                {classificationResult.ai_analysis.primary_role}
                              </p>
                            </div>
                          )}

                          {classificationResult.ai_analysis
                            .experience_years && (
                            <div className="mb-4">
                              <p className="text-sm text-slate-300 font-medium font-semibold mb-1">
                                Experience:
                              </p>
                              <p className="text-blue-200 font-semibold">
                                {
                                  classificationResult.ai_analysis
                                    .experience_years
                                }{" "}
                                years
                              </p>
                            </div>
                          )}

                          {classificationResult.ai_analysis.skills &&
                            classificationResult.ai_analysis.skills.length >
                            0 && (
                              <div className="mb-4">
                                <p className="text-sm text-slate-300 font-medium font-semibold mb-2">
                                  Technical Skills:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {classificationResult.ai_analysis.skills.map(
                                    (skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {classificationResult.ai_analysis.languages &&
                            classificationResult.ai_analysis.languages.length >
                            0 && (
                              <div className="mb-4">
                                <p className="text-sm text-slate-300 font-medium font-semibold mb-2">
                                  Languages:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {classificationResult.ai_analysis.languages.map(
                                    (lang, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-indigo-500 text-white rounded-full text-sm font-semibold"
                                      >
                                        {lang}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {classificationResult.ai_analysis.projects &&
                            classificationResult.ai_analysis.projects.length >
                            0 && (
                              <div className="mb-4">
                                <p className="text-sm text-slate-300 font-medium font-semibold mb-2">
                                  Projects:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {classificationResult.ai_analysis.projects.map(
                                    (project, idx) => (
                                      <li
                                        key={idx}
                                        className="text-blue-200 text-sm"
                                      >
                                        {project}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {classificationResult.ai_analysis
                            .recommended_categories &&
                            classificationResult.ai_analysis
                              .recommended_categories.length > 0 && (
                              <div>
                                <p className="text-sm text-slate-300 font-medium font-semibold mb-2">
                                  Recommended Roles:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {classificationResult.ai_analysis.recommended_categories.map(
                                    (cat, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold"
                                      >
                                        {cat}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : cvFile ? (
                // Show file selected state
                <div className="border-4 border-solid border-green-500 rounded-xl p-8 bg-green-900/20 border-green-500/50 mb-4">
                  <div className="text-center">
                    <svg
                      className="w-20 h-20 mx-auto mb-4 text-green-600"
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
                    <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                      File Selected
                    </h3>
                    <p className="text-slate-300 font-medium mb-4 font-semibold">
                      {cvFile.name}
                    </p>
                    <p className="text-sm text-slate-400 mb-4">
                      Size: {(cvFile.size / 1024).toFixed(2)} KB
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCVSubmit}
                        disabled={uploading}
                        className="px-6 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Uploading...
                          </span>
                        ) : (
                          "Upload CV"
                        )}
                      </button>
                      <button
                        onClick={() => setCvFile(null)}
                        className="px-6 py-3 bg-gray-300 text-slate-300 font-medium font-bold rounded-full hover:bg-slate-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show upload interface
                <label htmlFor="cv-upload">
                  <div className="border-4 border-dashed border-slate-500 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-900/20 border-blue-500/50 transition-all cursor-pointer">
                    <svg
                      className="w-20 h-20 mx-auto mb-4 text-slate-400"
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
                    <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                      Upload Your CV
                    </h3>
                    <p className="text-slate-400 mb-4">
                      PDF, DOC, or DOCX (Max 5MB)
                    </p>
                    <div className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all inline-block">
                      Choose File
                    </div>
                  </div>
                  <input
                    id="cv-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Skills Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">
                  Skills
                </h2>
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all text-sm"
                >
                  + Add Skill
                </button>
              </div>

              {profile.skills.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  No skills added yet. Click "Add Skill" to get started!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold flex items-center gap-2 group"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="text-blue-700 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Education & Experience */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
              <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg font-extrabold">
                Education & Experience
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                    University
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.university}
                      onChange={(e) =>
                        setProfile({ ...profile, university: e.target.value })
                      }
                      placeholder="e.g., Cairo University"
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.university || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                    Degree
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.degree}
                      onChange={(e) =>
                        setProfile({ ...profile, degree: e.target.value })
                      }
                      placeholder="e.g., Computer Science"
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.degree || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                    Years of Experience
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={profile.experience}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          experience: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all"
                    />
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.experience} years
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                    Experience Level
                  </label>
                  {editing ? (
                    <select
                      value={profile.experienceLevel}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          experienceLevel: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition-all"
                    >
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  ) : (
                    <p className="text-xl text-white font-semibold">
                      {profile.experienceLevel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Saved Items & Actions */}
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-cyan-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-xl mb-1">{user.name}</h3>
                <p className="text-sm opacity-90 mb-3">{user.email}</p>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-6 border-2 border-slate-600">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ⭐ Saved Jobs
              </h2>
              <div className="space-y-3">
                {savedJobs.length > 0 ? (
                  savedJobs.map((job) => (
                    <div
                      key={job._id || job.id}
                      onClick={() =>
                        navigate(`/employee/jobs/${job._id || job.id}`)
                      }
                      className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <h3 className="font-bold text-white text-sm mb-1">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-300">{job.company}</p>
                      {job.location && (
                        <p className="text-xs text-slate-400 mt-1">
                          {job.location}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4">
                    No saved jobs yet. Browse jobs and click "Save" to bookmark
                    them!
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/employee/jobs")}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all text-sm"
              >
                View All Jobs →
              </button>
            </div>

            {/* Saved Courses */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-6 border-2 border-slate-600">
              <h2 className="text-xl font-bold text-white mb-4">My Courses</h2>
              <div className="space-y-3">
                {savedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"
                  >
                    <h3 className="font-bold text-white text-sm mb-2">
                      {course.title}
                    </h3>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 inline-block">
                      {course.progress}% Complete
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-all text-sm">
                View All Courses →
              </button>
            </div>

            {/* Logout */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-6 border-2 border-slate-600">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}
