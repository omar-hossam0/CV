import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "";
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Show success message
        console.log("✅ Login successful!", data);

        // Check if there's a redirect URL saved
        const redirectUrl = localStorage.getItem("redirectAfterLogin");
        const jobId = localStorage.getItem("applyToJobId");

        if (redirectUrl && jobId) {
          // Clear the saved redirect data
          localStorage.removeItem("redirectAfterLogin");
          localStorage.removeItem("applyToJobId");
          // Redirect to the job details page
          navigate(`/employee/jobs/${jobId}`);
        } else if (redirectUrl) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectUrl);
        } else {
          // Normal redirect based on role
          if (data.user.role === "hr") {
            navigate("/hr/dashboard");
          } else {
            navigate("/employee/dashboard");
          }
        }
      } else {
        // Show error message
        setError(
          data.message || "Login failed. Please check your credentials.",
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Network error. Please make sure the backend (port 5000) is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-8 transition-colors duration-300 relative overflow-hidden ${isDark
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
          : "bg-gradient-to-br from-blue-50 via-white to-cyan-50"
        }`}
    >
      {/* Back to Home Button */}
      <Link
        to="/"
        className={`absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${isDark
            ? "bg-slate-800/80 text-white hover:bg-slate-700 border border-slate-600"
            : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200 shadow-md"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="font-medium">Home</span>
      </Link>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl animate-float ${isDark ? "bg-blue-500 opacity-20" : "bg-blue-400 opacity-30"
            }`}
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className={`absolute top-40 right-10 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-float ${isDark ? "bg-blue-600 opacity-20" : "bg-cyan-400 opacity-30"
            }`}
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className={`absolute -bottom-32 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-float ${isDark ? "bg-cyan-500 opacity-20" : "bg-blue-300 opacity-30"
            }`}
          style={{ animationDelay: "4s" }}
        ></div>
      </div>
      {/* Main Container - Split Layout */}
      <div
        className={`relative z-10 w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden animate-fadeIn border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}
      >
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-slideLeft {
            animation: slideLeft 0.5s ease-out;
          }
          .animate-slideRight {
            animation: slideRight 0.5s ease-out;
          }
          @keyframes slideLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        <div className="grid md:grid-cols-2 h-full">
          {/* Left Side: Login Form */}
          <div className="flex flex-col justify-center p-4 md:p-6 animate-slideLeft">
            <div className="max-w-md mx-auto w-full">
              {/* Logo */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <span className="text-lg font-bold text-white">
                    JobCompass
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mb-1">
                  Welcome Back
                </h2>
                <p className="text-xs text-slate-300">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-2 p-2.5 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                {/* Google Login */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-slate-600 rounded-lg hover:bg-slate-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    Log in with Google
                  </span>
                </button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-slate-800 text-slate-400 uppercase tracking-wide">
                      OR SIGN IN WITH EMAIL
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                    placeholder="Email Address"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
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
                      ) : (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("employee")}
                      className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 border-2 ${role === "employee"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400"
                        }`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("hr")}
                      className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 border-2 ${role === "hr"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400"
                        }`}
                    >
                      HR
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-slate-600 rounded focus:ring-blue-500 bg-slate-700"
                    />
                    <span className="ml-2 text-sm text-slate-300">
                      Keep me logged in
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Forgot your password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Signing in..." : "Log In"}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-slate-300 mt-6">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-all duration-300 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Right Side: Illustration */}
          <div className="hidden md:flex flex-col justify-center items-center relative animate-slideRight overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Welcome Back"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative max-w-xs text-center z-10 px-8">
              <h3
                className="text-3xl font-bold text-white drop-shadow-lg"
                style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}
              >
                Welcome Back!
              </h3>
              <p
                className="text-base text-white mt-3 drop-shadow-lg"
                style={{ textShadow: "1px 1px 6px rgba(0,0,0,0.8)" }}
              >
                Sign in to continue your career journey
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
