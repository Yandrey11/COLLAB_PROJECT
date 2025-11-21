import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [calendarError, setCalendarError] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Auto-detect calendar errors after initial load
  useEffect(() => {
    if (!calendarError) {
      // Set a timer to manually check for errors (since we can't access iframe content due to CORS)
      const errorTimer = setTimeout(() => {
        // User can manually trigger error check via the refresh button if needed
        // This is a fallback - the onError handler should catch most errors
      }, 4000);

      return () => clearTimeout(errorTimer);
    }
  }, [calendarError]);


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
          const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
          const res = await fetch(`${baseUrl}/api/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          if (!res.ok) {
            console.warn("🚫 Token validation failed:", res.status);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
          } else {
            const data = await res.json();
            const resolvedUser = data.user ?? data;
            setUser(resolvedUser);
            localStorage.setItem("user", JSON.stringify(resolvedUser));
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error fetching user from backend:", err);
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
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
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
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
        fontFamily: "'Montserrat', sans-serif",
        padding: "40px 16px",
        gap: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 24,
        }}
      >
        {/* Left: Overview / Navigation */}
        <aside
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            height: "fit-content",
          }}
        >
          <h2 style={{ margin: 0, color: "#4f46e5" }}>Guidance Dashboard</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
            The Dashboard provides counselors with an at-a-glance view of personal schedules, sessions,
            meetings, and planned activities for the current day or week.
          </p>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => navigate("/records")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #eef2ff",
                background: "linear-gradient(90deg,#eef2ff,#fff)",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Records Page
            </button>
            <button
              onClick={() => navigate("/reports")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #eef2ff",
                background: "linear-gradient(90deg,#fff,#f8fafc)",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Reports Page
            </button>
            <button
              onClick={() => navigate("/notifications")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #eef2ff",
                background: "linear-gradient(90deg,#fff,#fffef9)",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Notification Center
            </button>
            <button
              onClick={() => navigate("/profile")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #eef2ff",
                background: "linear-gradient(90deg,#fff,#f8fafc)",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              User Profile & Settings
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={handleRefresh}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
              Data Synchronization:
              <div style={{ marginTop: 6 }}>
                The dashboard listens for changes to stored user data and will update automatically across
                browser contexts. For backend-driven real-time updates, server-side events or websockets
                would be used (not modified here).
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Main content */}
        <main>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ color: "#111827", margin: 0 }}>
                  Welcome{user?.name ? `, ${user.name}` : ""} 🎉
                </h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  Manage today's sessions, access records and reports, and view notifications.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Account</div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{user?.email || "—"}</div>
              </div>
            </div>
          </div>

          {/* Google Calendar Integration */}
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: "#4f46e5", marginBottom: 8 }}>
                  Calendar 
                </h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                  View your Google Calendar events alongside counseling records from the system. Calendar events and
                  records are read-only.{" "}
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    (Note: You may need to be logged into Google to view your calendar)
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setCalendarError(false);
                  const iframe = document.querySelector('iframe[title="Google Calendar"]');
                  if (iframe) {
                    iframe.src = iframe.src; // Reload iframe
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #e6e9ef",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4f46e5",
                }}
              >
                Refresh Calendar
              </button>
            </div>

            {calendarError ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "#fef2f2",
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                }}
              >
                <div style={{ fontSize: 16, color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>
                  ⚠️ Google Calendar is temporarily unavailable
                </div>
                <p style={{ color: "#991b1b", fontSize: 14, margin: 0, marginBottom: 16 }}>
                  Please try refreshing the page or open Google Calendar directly.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      setCalendarError(false);
                      const iframe = document.querySelector('iframe[title="Google Calendar"]');
                      if (iframe) {
                        iframe.src = `https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23FFFFFF&ctz=Asia%2FManila&t=${Date.now()}`;
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid #dc2626",
                      background: "#fff",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid #4f46e5",
                      background: "#4f46e5",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    Open Google Calendar
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", minHeight: 600 }}>
                <iframe
                  src="https://calendar.google.com/calendar/embed?height=600"
                  style={{
                    border: "1px solid #e6e9ef",
                    borderRadius: 12,
                    width: "100%",
                    height: 600,
                  }}
                  frameBorder="0"
                  scrolling="no"
                  onError={(e) => {
                    console.error("Google Calendar iframe error:", e);
                    setCalendarError(true);
                  }}
                  onLoad={(e) => {
                    // Reset error state on successful load
                    setCalendarError(false);
                  }}
                  title="Google Calendar"
                  allowFullScreen
                ></iframe>
                {/* Note: Google Calendar embed requires user to be logged into Google or have a public calendar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    fontSize: 11,
                    color: "#9ca3af",
                    background: "rgba(255,255,255,0.9)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    pointerEvents: "none",
                  }}
                >
                  Tip: Log into Google to view your calendar
                </div>
              </div>
            )}

            {/* Counseling Records List */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: 0, color: "#111827", marginBottom: 12 }}>
                Counseling Records ({records.length})
              </h4>
              {recordsLoading ? (
                <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>
                  Loading records...
                </div>
              ) : records.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    background: "#f9fafb",
                    borderRadius: 12,
                    color: "#6b7280",
                  }}
                >
                  No counseling records found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {records
                    .filter((record) => record.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 10)
                    .map((record) => {
                      const recordDate = new Date(record.date);
                      const statusColors = {
                        Completed: { bg: "rgba(16,185,129,0.1)", color: "#059669" },
                        Ongoing: { bg: "rgba(245,158,11,0.1)", color: "#d97706" },
                        Referred: { bg: "rgba(168,85,247,0.1)", color: "#9333ea" },
                      };
                      const statusStyle = statusColors[record.status] || {
                        bg: "rgba(148,163,184,0.1)",
                        color: "#64748b",
                      };

                      return (
                        <div
                          key={record._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 12,
                            background: "#f9fafb",
                            border: "1px solid #e6e9ef",
                            borderRadius: 10,
                            cursor: "default",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                            <div
                              style={{
                                width: 4,
                                height: 40,
                                background: statusStyle.color,
                                borderRadius: 2,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "#111827",
                                  fontSize: 14,
                                  marginBottom: 4,
                                }}
                              >
                                {record.clientName} – {record.sessionType || "General Counseling"}
                              </div>
                              <div style={{ fontSize: 12, color: "#6b7280" }}>
                                {recordDate.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {record.status || "Ongoing"}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </section>

          {/* Additional info / quick links */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
              }}
            >
              <h4 style={{ margin: 0, color: "#111827" }}>Notification Center</h4>
              <p style={{ color: "#6b7280", marginTop: 6 }}>
                Alerts and reminders for upcoming sessions, pending reports, and announcements will appear here.
              </p>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
              }}
            >
              <h4 style={{ margin: 0, color: "#111827" }}>Quick Reports</h4>
              <p style={{ color: "#6b7280", marginTop: 6 }}>
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
