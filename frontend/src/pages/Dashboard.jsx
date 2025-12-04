 import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CalendarView from "../components/CalendarView";
import CounselorSidebar from "../components/CounselorSidebar";
import { initializeTheme } from "../utils/themeUtils";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useInactivity } from "../hooks/useInactivity";


export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Initialize inactivity detection
  useInactivity({
    onLogout: () => {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    },
    enabled: !!user, // Only enable when user is loaded
  });

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


  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left: Overview / Navigation */}
        <CounselorSidebar />

        {/* Right: Main content */}
        <main>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">
                Welcome{user?.name ? `, ${user.name}` : ""} 🎉
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Manage today's sessions, access records and reports, and view notifications.
              </p>
            </div>
          </div>

          {/* Google Calendar Integration */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 mb-1">
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
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={calendarLoading}
                >
                  {calendarLoading ? "Refreshing..." : "Refresh Calendar"}
              </button>
              ) : null}
            </div>

            {/* Always show calendar view with records - Google Calendar is optional */}
            {calendarLoading && recordsLoading ? (
              <div className="p-10 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-base text-gray-600 dark:text-gray-400 font-semibold mb-2">Loading calendar...</div>
              </div>
            ) : (
              <div>
                <CalendarView 
                  calendarEvents={calendarConnected ? calendarEvents : []}
                  records={records}
                />
                
                {/* Show connect button if calendar not connected */}
                {!calendarConnected && (
                  <div className="mt-4 p-4 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm text-indigo-800 dark:text-indigo-300 m-0 mb-2">
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

        </main>
      </div>
    </div>
  );
}
