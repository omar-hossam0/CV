import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { API_BASE_URL } from "../utils/api.js";

export default function HRProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = React.useRef(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    totalInterviews: 0,
  });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    location: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    setProfile({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      department: "Human Resources",
      position: "HR Manager",
      location: "Cairo, Egypt",
    });

    // Load profile image from localStorage
    if (userData.profileImage) {
      setProfileImage(userData.profileImage);
    }

    fetchStats(token);
  }, [navigate]);

  const fetchStats = async (token) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      // Fetch user profile from API
      const profileRes = await fetch("${API_BASE_URL}/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          // Update user in localStorage with latest data from backend
          const updatedUser = {
            ...storedUser,
            ...profileData.user,
            role: storedUser.role || profileData.user.role, // Keep the role from original user or use from API
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);

          // Set profile image if available
          if (profileData.user.profileImage) {
            setProfileImage(profileData.user.profileImage);
          }

          // Update profile form data
          setProfile({
            name: profileData.user.name || "",
            email: profileData.user.email || "",
            phone: profileData.user.phone || "",
            department: "Human Resources",
            position: "HR Manager",
            location: "Cairo, Egypt",
          });
        }
      }

      const jobsRes = await fetch("${API_BASE_URL}/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const candidatesRes = await fetch(
        "${API_BASE_URL}/api/candidates",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (jobsRes.ok && candidatesRes.ok) {
        const jobsData = await jobsRes.json();
        const candidatesData = await candidatesRes.json();

        // Count job applications (interviews) from all candidates
        let totalInterviewsCount = 0;
        if (candidatesData.data && Array.isArray(candidatesData.data)) {
          totalInterviewsCount = candidatesData.data.reduce(
            (sum, candidate) => {
              return (
                sum +
                (candidate.applications ? candidate.applications.length : 0)
              );
            },
            0
          );
        }

        setStats({
          totalJobs: jobsData.count || jobsData.data?.length || 0,
          totalCandidates:
            candidatesData.count || candidatesData.data?.length || 0,
          totalInterviews: totalInterviewsCount,
        });

        console.log("✅ HR Stats loaded:", {
          jobs: jobsData.count || jobsData.data?.length,
          candidates: candidatesData.count || candidatesData.data?.length,
          interviews: totalInterviewsCount,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "error");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      // Upload profile image if changed
      if (imageFile) {
        const formData = new FormData();
        formData.append("profileImage", imageFile);

        const uploadRes = await fetch(
          "${API_BASE_URL}/api/auth/me/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const uploadData = await uploadRes.json();

        if (uploadRes.ok) {
          // Update user in localStorage with new profile image
          const updatedUser = {
            ...user,
            name: profile.name,
            phone: profile.phone,
            profileImage: uploadData.profileImage,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setProfileImage(uploadData.profileImage);
          setImageFile(null);

          // Trigger storage event for other components
          window.dispatchEvent(new Event("storage"));

          showToast("✅ Profile image saved to database!", "success");
        } else {
          showToast(uploadData.message || "Failed to upload image", "error");
          return;
        }
      }

      // Update profile info in backend
      const updateRes = await fetch("${API_BASE_URL}/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        const updatedUser = {
          ...user,
          ...updateData.user,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Trigger storage event for other components
        window.dispatchEvent(new Event("storage"));

        showToast("✅ Profile updated successfully!", "success");
      }

      setEditing(false);

      // Refresh stats after updating profile
      fetchStats(token);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile", "error");
    }
  };

  const refreshStats = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔄 Refreshing HR stats...");
      await fetchStats(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-12 page-slide-up">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 h-48 rounded-b-3xl shadow-lg">
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="relative w-32 h-32 rounded-full bg-slate-800 shadow-2xl flex items-center justify-center border-4 border-slate-700">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                {user.name?.charAt(0).toUpperCase() || "H"}
              </div>
            )}
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-cyan-600 transition flex items-center justify-center border-2 border-slate-700"
                title="Change profile picture"
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="text-center mt-20 mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
          {profile.name}
        </h1>
        <p className="text-slate-300 text-lg mb-2 font-medium">
          Member since{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          • {profile.location}
        </p>
        <span className="inline-block px-5 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-500/40 text-cyan-300 rounded-full text-base font-bold mt-3 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
          {profile.position}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">
            Performance Overview
          </h2>
          <button
            onClick={refreshStats}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform duration-300"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-xl p-8 text-center border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <p className="text-6xl font-extrabold text-cyan-400 mb-3 drop-shadow-lg">
              {stats.totalJobs}
            </p>
            <p className="text-slate-200 text-lg font-bold">Jobs Posted</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-xl p-8 text-center border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
            <p className="text-6xl font-extrabold text-purple-400 mb-3 drop-shadow-lg">
              {stats.totalCandidates}
            </p>
            <p className="text-slate-200 text-lg font-bold">
              Candidates Reviewed
            </p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-xl p-8 text-center border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
            <p className="text-6xl font-extrabold text-emerald-400 mb-3 drop-shadow-lg">
              {stats.totalInterviews}
            </p>
            <p className="text-slate-200 text-lg font-bold">
              Interviews Scheduled
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border-2 border-slate-600">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">
              Profile Information
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-green-600 transition"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
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
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition placeholder-slate-400 font-medium"
                />
              ) : (
                <p className="text-xl text-white font-semibold">
                  {profile.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <p className="text-xl text-white font-semibold">
                {profile.email}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition placeholder-slate-400 font-medium"
                />
              ) : (
                <p className="text-xl text-white font-semibold">
                  {profile.phone || "Not provided"}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                Department
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) =>
                    setProfile({ ...profile, department: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition placeholder-slate-400 font-medium"
                />
              ) : (
                <p className="text-xl text-white font-semibold">
                  {profile.department}
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                Position
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) =>
                    setProfile({ ...profile, position: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition placeholder-slate-400 font-medium"
                />
              ) : (
                <p className="text-xl text-white font-semibold">
                  {profile.position}
                </p>
              )}
            </div>

            {/* Location */}
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
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/30 transition placeholder-slate-400 font-medium"
                />
              ) : (
                <p className="text-xl text-white font-semibold">
                  {profile.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-red-900/50 text-red-400 font-semibold rounded-lg hover:bg-red-900/70 transition border border-red-800"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
