import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (confirm("Are you sure you want to log out?")) {
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
      alert("You have been logged out!");
      navigate("/", { replace: true });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // Helper to render sessions: expects user.sessions to be an array of objects
  const renderSessions = (sessions = []) => {
    if (!sessions.length) {
      return (
        <div
          style={{
            padding: "18px",
            borderRadius: "10px",
            background: "#fafafa",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          No sessions scheduled for the selected period.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sessions.map((s, idx) => {
          const date = s?.datetime ? new Date(s.datetime) : null;
          const dateStr = date
            ? date.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unscheduled";

          return (
            <div
              key={s.id ?? idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px",
                background: "#fff",
                border: "1px solid #e6e9ef",
                borderRadius: "12px",
                boxShadow: "0 6px 14px rgba(15,23,42,0.03)",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: "#eef2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4f46e5",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {s.studentName?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "ST"}
                </div>

                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#111827" }}>
                    {s.studentName || "Unknown Student"}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{dateStr}</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                  {s.type || "General"}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: s.status === "Confirmed" ? "#065f46" : s.status === "Pending" ? "#92400e" : "#374151",
                    background:
                      s.status === "Confirmed"
                        ? "rgba(16,185,129,0.08)"
                        : s.status === "Pending"
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(148,163,184,0.06)",
                    padding: "6px 10px",
                    borderRadius: 8,
                    display: "inline-block",
                    fontWeight: 600,
                  }}
                >
                  {s.status || "Pending"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Derive sessions for "today or week" if user has schedule data.
  // We will not call backend here to keep backend connection unchanged.
  const allSessions = Array.isArray(user?.sessions) ? user.sessions : [];

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

          {/* Sessions Section */}
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, color: "#4f46e5" }}>Sessions</h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
                  Lists scheduled and ongoing counseling sessions with essential details.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleRefresh()}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #e6e9ef",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Refresh
                </button>
                <button
                  onClick={() => navigate("/sessions/new")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  New Session
                </button>
              </div>
            </div>

            {renderSessions(allSessions)}
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
