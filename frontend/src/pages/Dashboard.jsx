import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { NotificationBadgeBadge } from "../components/NotificationBadge";
import CalendarView from "../components/CalendarView";
import { initializeTheme } from "../utils/themeUtils";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to get full image URL from backend
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // If it's a data URL (base64), return as is
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  // Otherwise, prepend the backend URL
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${path}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Fetch Google Calendar events
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setCalendarLoading(true);
        const token = localStorage.getItem("token");
        if (!token || !user) {
          setCalendarLoading(false);
          return;
        }

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${baseUrl}/auth/dashboard/calendar-events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.connected) {
          setCalendarEvents(res.data.events || []);
          setCalendarConnected(true);
        } else {
          setCalendarEvents([]);
          setCalendarConnected(false);
        }
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        setCalendarEvents([]);
        // Check if it's a connection issue or just no tokens
        if (error.response?.status === 401 || error.response?.data?.connected === false) {
          setCalendarConnected(false);
        } else {
          // Other errors - still mark as not connected
          setCalendarConnected(false);
          console.warn("Calendar fetch error details:", error.response?.data || error.message);
        }
      } finally {
        setCalendarLoading(false);
      }
    };

    if (user) {
      fetchCalendarEvents();
      // Auto-refresh calendar every 5 minutes
      const interval = setInterval(fetchCalendarEvents, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);


  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Load user and token validation (unchanged backend connection logic)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      (async () => {
        // ✅ Step 1: Check if token was passed via Google redirect URL
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromURL = urlParams.get("token");

        if (tokenFromURL) {
          console.log("🔑 Received Google token from URL");
          localStorage.setItem("token", tokenFromURL);

          // ✅ Optionally clean up the URL
          window.history.replaceState({}, document.title, "/dashboard");
        }

        // ✅ Step 2: Get token (from localStorage or Google)
        const token = localStorage.getItem("token");

        if (!token) {
          console.warn("🚫 No token found, redirecting to login...");
          navigate("/login", { replace: true });
          setLoading(false);
          return;
        }

        try {
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${baseUrl}/api/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
            console.warn("🚫 Token validation failed:", res.status, errorData);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
          } else {
            const data = await res.json();
            const resolvedUser = data.user ?? data;
            console.log("✅ User authenticated successfully:", resolvedUser);
            setUser(resolvedUser);
            localStorage.setItem("user", JSON.stringify(resolvedUser));
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("❌ Error fetching user from backend:", err);
            // Don't redirect on network errors, let the user see the error
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 100);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [navigate]);

  // Listen to storage events so multiple tabs / components can stay in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(parsed);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  // Fetch records from database
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setRecordsLoading(true);
        const token = localStorage.getItem("token");
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${baseUrl}/api/records`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setRecords(res.data || []);
      } catch (error) {
        console.error("Error fetching records:", error);
        setRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    };

    if (user) {
      fetchRecords();
      // Auto-refresh records every 30 seconds for sync
      const interval = setInterval(fetchRecords, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Manual refresh just reloads user from localStorage (keeps backend untouched)
  const handleRefresh = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      setUser(parsed);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
      console.log("Logout clicked!");
      const token = localStorage.getItem("authToken");

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
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left: Overview / Navigation */}
        <aside className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm h-fit lg:sticky lg:top-6">
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
              <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-indigo-600"
        >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-gray-100 text-base">{user?.name || profile?.name || "Counselor"}</div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 m-0">Guidance Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            The Dashboard provides counselors with an at-a-glance view of personal schedules, sessions,
            meetings, and planned activities for the current day or week.
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-3 rounded-xl border border-indigo-200 text-white font-semibold text-left transition-all hover:shadow-md"
              style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#fff" }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/records")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:to-gray-700 hover:shadow-sm text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
            >
              Records Page
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:to-gray-700 hover:shadow-sm text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
            >
              Reports Page
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:to-gray-700 hover:shadow-sm text-gray-900 dark:text-gray-100 font-semibold text-left transition-all relative"
            >
              Notification Center
              <span className="absolute top-1 right-1">
                <NotificationBadgeBadge />
              </span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:to-gray-700 hover:shadow-sm text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
            >
              User Profile & Settings
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleRefresh}
                className="flex-1 p-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Data Synchronization:
              <div className="mt-1">
                The dashboard listens for changes to stored user data and will update automatically across
                browser contexts. For backend-driven real-time updates, server-side events or websockets
                would be used (not modified here).
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Main content */}
        <main>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">
                  Welcome{user?.name ? `, ${user.name}` : ""} 🎉
                </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage today's sessions, access records and reports, and view notifications.
                </p>
              </div>

          </div>

          {/* Google Calendar Integration */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 m-0 mb-2">
                  Calendar 
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                  View your Google Calendar events alongside counseling records from the system. Calendar events and
                  records are read-only.
                </p>
              </div>
              {calendarConnected ? (
              <button
                  onClick={async () => {
                    setCalendarLoading(true);
                    const token = localStorage.getItem("token");
                    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                    try {
                      const res = await axios.get(`${baseUrl}/auth/dashboard/calendar-events`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (res.data.connected) {
                        setCalendarEvents(res.data.events || []);
                        setCalendarConnected(true);
                      }
                    } catch (error) {
                      console.error("Error refreshing calendar:", error);
                    } finally {
                      setCalendarLoading(false);
                  }
                }}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={calendarLoading}
                >
                  {calendarLoading ? "Refreshing..." : "Refresh Calendar"}
              </button>
              ) : null}
            </div>

            {/* Always show calendar view with records - Google Calendar is optional */}
            {calendarLoading && recordsLoading ? (
              <div className="p-10 text-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-base text-gray-600 font-semibold mb-2">Loading calendar...</div>
              </div>
            ) : (
              <div>
                <CalendarView 
                  calendarEvents={calendarConnected ? calendarEvents : []}
                  records={records}
                />
                
                {/* Show connect button if calendar not connected */}
                {!calendarConnected && (
                  <div className="mt-4 p-4 text-center bg-indigo-50 rounded-xl border border-indigo-200">
                    <p className="text-sm text-indigo-800 m-0 mb-2">
                      Connect your Google Calendar to see events alongside your records.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                          window.location.href = `${baseUrl}/auth/google/calendar/connect?token=${token}`;
                        } catch (error) {
                          await Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Failed to initiate Google Calendar connection.",
                          });
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Connect Google Calendar
                    </button>
                </div>
                )}
              </div>
            )}
          </section>

          {/* Additional info / quick links */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 m-0">Notification Center</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Alerts and reminders for upcoming sessions, pending reports, and announcements will appear here.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 m-0">Quick Reports</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Generate summary or detailed reports on counseling activities and session outcomes via the Reports
                Page.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
