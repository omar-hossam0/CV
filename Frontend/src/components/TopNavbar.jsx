import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Listen for storage changes to update profile image
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for same-window updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch unread notifications count for HR
  useEffect(() => {
    if (user?.role === "hr") {
      const fetchUnreadCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(
            "http://localhost:5000/api/notifications/unread-count",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.data?.unreadCount || 0);
          }
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      };

      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    if (user.role === "hr") {
      return [
        { name: "Dashboard", path: "/hr/dashboard", icon: "home" },
        { name: "Jobs", path: "/hr/jobs", icon: "briefcase" },
        { name: "Profile", path: "/hr/profile", icon: "user" },
      ];
    }

    // Employee/User navigation (Skills removed)
    return [
      { name: "Home", path: "/employee/dashboard", icon: "home" },
      { name: "Jobs", path: "/employee/jobs", icon: "briefcase" },
      { name: "Interview", path: "/employee/interview", icon: "target" },
      { name: "Profile", path: "/employee/profile", icon: "user" },
    ];
  };

  const navItems = getNavItems();
  const dashboardPath =
    user?.role === "hr" ? "/hr/dashboard" : "/employee/dashboard";

  return (
    <header className="bg-slate-900 shadow-xl sticky top-0 z-50 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              JobCompass
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-bold text-base transition-all duration-300 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="hidden md:flex items-center gap-3">
              {/* Notifications Button (HR only) */}
              {user.role === "hr" && (
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNotifications(false)}
                      />

                      <div className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-20 max-h-[500px] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700">
                          <h3 className="text-lg font-bold text-white">
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        <div className="overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <svg
                                className="w-16 h-16 mx-auto text-slate-600 mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                              </svg>
                              <p className="text-slate-400 font-medium">
                                No notifications yet
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-700">
                              {notifications.map((notif) => (
                                <div
                                  key={notif._id}
                                  onClick={() => {
                                    if (!notif.read)
                                      handleMarkAsRead(notif._id);
                                    if (notif.link) navigate(notif.link);
                                    setShowNotifications(false);
                                  }}
                                  className={`p-4 hover:bg-slate-700 cursor-pointer transition-colors ${
                                    !notif.read ? "bg-blue-900/30" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                        notif.type === "application"
                                          ? "bg-green-500/20"
                                          : "bg-blue-500/20"
                                      }`}
                                    >
                                      <svg
                                        className={`w-5 h-5 ${
                                          notif.type === "application"
                                            ? "text-green-400"
                                            : "text-blue-400"
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-white">
                                        {notif.title}
                                      </p>
                                      <p className="text-sm text-slate-400 mt-1">
                                        {notif.message}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-2">
                                        {new Date(
                                          notif.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    {!notif.read && (
                                      <div className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-right">
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-xs text-slate-400 uppercase">{user.role}</p>
              </div>
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-800">
            <svg
              className="w-6 h-6 text-white font-bold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
