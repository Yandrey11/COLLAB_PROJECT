import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { NotificationBadgeBadge } from "./NotificationBadge";
import { initializeTheme } from "../utils/themeUtils";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to get full image URL from backend
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${path}`;
};

export default function CounselorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Fetch fresh user info from backend (to get latest permissions)
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        setUser(parsed);
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.get(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = res.data.user || res.data;
      if (userData && (userData.name || userData.email)) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }
  };

  // Load user from localStorage or fetch from backend
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user) return;

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${baseUrl}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setProfile(res.data.profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Don't show error - profile is optional
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleRefresh = () => {
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      setUser(parsed);
      // Refresh profile as well
      if (parsed) {
        const token = localStorage.getItem("token");
        if (token) {
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          axios.get(`${baseUrl}/api/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((res) => {
            if (res.data.success) {
              setProfile(res.data.profile);
            }
          }).catch(() => {});
        }
      }
    } catch {
      setUser(null);
    }
  };

  const handleLogout = useCallback(async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        if (token) {
          await fetch(`${baseUrl}/api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (err) {
        console.error("Error calling logout endpoint:", err);
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await Swal.fire({
        icon: "info",
        title: "Logged Out",
        text: "You have been logged out!",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Helper function to check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === "admin" || user.permissions?.is_admin === true) {
      return true;
    }
    
    // If permissions field doesn't exist, allow access (backwards compatibility)
    const hasPermissionField = user.permissions && Object.keys(user.permissions).length > 0;
    if (!hasPermissionField) {
      return true; // Backwards compatibility
    }
    
    return user.permissions?.[permission] === true;
  };

  // Navigation items with routes
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { 
      label: "Records Page", 
      path: "/records",
      requiresPermission: "can_view_records"
    },
    { 
      label: "Reports Page", 
      path: "/reports",
      requiresPermission: "can_view_reports"
    },
    { label: "Notification Center", path: "/notifications", hasBadge: true },
    { label: "User Profile & Settings", path: "/profile" },
  ].filter(item => {
    // Filter out items that require permissions the user doesn't have
    if (item.requiresPermission) {
      return hasPermission(item.requiresPermission);
    }
    return true;
  });

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm h-fit lg:sticky lg:top-6">
      {/* Profile Picture and Name */}
      <div className="flex flex-col items-center gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        {profile?.profilePicture ? (
          <img
            src={getImageUrl(profile.profilePicture)}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
        <div className="text-center">
          <div className="font-bold text-gray-900 dark:text-gray-100 text-base">
            {user?.name || profile?.name || "Counselor"}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 m-0">Guidance Dashboard</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        The Dashboard provides counselors with an at-a-glance view of personal schedules, sessions,
        meetings, and planned activities for the current day or week.
      </p>

      <div className="flex flex-col gap-3 mt-6">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`p-3 rounded-xl border font-semibold text-left transition-all relative ${
                active
                  ? "border-indigo-200 text-white hover:shadow-md"
                  : "border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:to-gray-700 hover:shadow-sm text-gray-900 dark:text-gray-100"
              }`}
              style={
                active
                  ? { background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#fff" }
                  : {}
              }
            >
              {item.label}
              {item.hasBadge && (
                <span className="absolute top-1 right-1">
                  <NotificationBadgeBadge />
                </span>
              )}
            </button>
          );
        })}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleRefresh}
            className="flex-1 p-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-600 text-white font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-red-500 dark:bg-red-500 text-white font-semibold hover:bg-red-600 dark:hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Data Synchronization:</span>
          <div className="mt-1">
            The dashboard listens for changes to stored user data and will update automatically across
            browser contexts. For backend-driven real-time updates, server-side events or websockets
            would be used (not modified here).
          </div>
        </div>
      </div>
    </aside>
  );
}

