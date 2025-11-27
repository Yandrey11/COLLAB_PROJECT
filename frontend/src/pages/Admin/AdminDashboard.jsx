import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminSidebar from "../../components/AdminSidebar";
import { initializeTheme } from "../../utils/themeUtils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Summary & activity
  const [summary, setSummary] = useState({
    totalUsers: "—",
    totalAdmins: "—",
    totalCounselors: "—",
    active: "—",
    inactive: "—",
    recentActivity: [],
  });

  // Notifications (polled)
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const notificationsIntervalRef = useRef(null);
  const summaryIntervalRef = useRef(null);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      // after successful login (backend redirect with token) we persist and normalize URL
      localStorage.setItem("adminToken", tokenFromUrl);
      window.history.replaceState({}, document.title, "/admindashboard");
    }

    const fetchAdmin = async () => {
      // ⚠️ TEMPORARILY DISABLED: Allow access without token for debugging
      const token = localStorage.getItem("adminToken");
      
      try {
        // main verification (do not change endpoint)
        console.log("📤 Sending request to /api/admin/dashboard");
        const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
          headers: token ? { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          } : {
            "Content-Type": "application/json"
          },
        });
        console.log("✅ Dashboard response received:", res.data);

        // If user is not admin -> Access Denied UI then redirect
        if (res.data.role !== "admin") {
          setAccessDenied(true);
          localStorage.removeItem("adminToken");
          // show a brief Access Denied message before redirecting
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2500);
          return;
        }

        // verified admin: store admin object and then load dashboard data
        setAdmin(res.data);

        // fetch summary and start notifications polling
        await Promise.all([fetchSummary(token)]);
        startNotificationsPolling(token);
        startSummaryPolling(token); // Start polling for recent activities
      } catch (err) {
        console.error("❌ Admin verification failed:", err);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        console.error("❌ Error headers:", err.response?.headers);
        if (err.response?.data?.message) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.response.data.message,
          });
        }
        localStorage.removeItem("adminToken");
        navigate("/adminlogin", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();

    return () => {
      // cleanup polling
      if (notificationsIntervalRef.current) clearInterval(notificationsIntervalRef.current);
      if (summaryIntervalRef.current) clearInterval(summaryIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Fetch overview/summary (uses a dedicated endpoint if available)
  const fetchSummary = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/summary", {
        headers: token ? { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        } : {
          "Content-Type": "application/json"
        },
      });
      // expected: { totalUsers, totalAdmins, totalCounselors, active, inactive, recentActivity: [] }
      setSummary((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      // If endpoint missing, keep defaults; optionally fallback to minimal values from dashboard response
      console.warn("Could not fetch summary:", err.message || err);
    }
  };


  // Notifications polling to provide near-real-time alerts
  const startNotificationsPolling = (token) => {
    const poll = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/notifications", {
          headers: token ? { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          } : {
            "Content-Type": "application/json"
          },
          params: { page: 1, limit: 5, status: "unread" },
        });
        setNotifications(res.data.notifications || []);
        setUnreadNotificationCount(res.data.unreadCount || 0);
      } catch (err) {
        console.warn("Notifications polling failed:", err.message || err);
      }
    };
    // initial fetch
    poll();
    // poll every 10 seconds
    notificationsIntervalRef.current = setInterval(poll, 10000);
  };

  // Summary polling to refresh recent activities
  const startSummaryPolling = (token) => {
    const poll = async () => {
      try {
        await fetchSummary(token);
      } catch (err) {
        console.warn("Summary polling failed:", err.message || err);
      }
    };
    // poll every 15 seconds to refresh recent activities
    summaryIntervalRef.current = setInterval(poll, 15000);
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
      localStorage.removeItem("adminToken");
      navigate("/", { replace: true });
    }
  };


  if (accessDenied) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "'Montserrat', sans-serif",
          flexDirection: "column",
          gap: 12,
          background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
        }}
      >
        <h2 style={{ color: "#dc2626" }}>Access Denied</h2>
        <p style={{ color: "#6b7280" }}>You do not have permission to access the Admin Dashboard. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left: Overview / Navigation */}
        <AdminSidebar />

        {/* Right: Main content */}
        <main>
          {/* Welcome Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-gray-900 dark:text-gray-100 m-0 text-2xl font-bold">
                  Welcome{admin?.name ? `, ${admin.name}` : ""} 🎉
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage users, monitor system activity, and access administrative tools.
                </p>
              </div>

            </div>
          </div>

          {/* Search and Filter Bar */}
          

          {/* Overview / Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-56">
              <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium m-0">Total Users</h3>
              <p className="text-indigo-600 dark:text-indigo-400 text-2xl font-bold mt-2 mb-1">
                {summary.totalUsers}
              </p>
              <div className="flex gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  <strong className="text-red-600 dark:text-red-400">{summary.totalAdmins}</strong> Admin{summary.totalAdmins !== "—" && summary.totalAdmins !== 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>
                  <strong className="text-blue-600 dark:text-blue-400">{summary.totalCounselors}</strong> Counselor{summary.totalCounselors !== "—" && summary.totalCounselors !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-56">
              <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium m-0">Active / Inactive</h3>
              <p className="text-green-600 dark:text-green-400 text-lg font-bold mt-2 mb-0">
                {summary.active} active · {summary.inactive} inactive
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-56 overflow-hidden">
              <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium m-0 mb-2">Recent Activity</h3>
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                {summary.recentActivity && summary.recentActivity.length > 0 ? (
                  summary.recentActivity.map((act) => (
                    <div 
                      key={act.id || act.timestamp} 
                      style={{ 
                        padding: "8px 10px", 
                        borderBottom: "1px solid #f3f4f6",
                        borderRadius: 6,
                        background: act.priority === "high" || act.priority === "critical" 
                          ? "rgba(239,68,68,0.05)" 
                          : "transparent",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (act.priority !== "high" && act.priority !== "critical") {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (act.priority !== "high" && act.priority !== "critical") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: 11, 
                            color: "#111827", 
                            fontWeight: 600,
                            marginBottom: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                            {act.title || act.message}
                            {(act.priority === "high" || act.priority === "critical") && (
                              <span
                                style={{
                                  padding: "1px 4px",
                                  borderRadius: 3,
                                  background: "#dc2626",
                                  color: "#fff",
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              >
                                {act.priority === "critical" ? "Critical" : "High"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.3 }}>
                            {act.description}
                          </div>
                          <div style={{ 
                            fontSize: 9, 
                            color: "#9ca3af", 
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}>
                            <span>{act.time || new Date(act.timestamp).toLocaleString()}</span>
                            {act.category && (
                              <>
                                <span>·</span>
                                <span style={{ 
                                  padding: "1px 4px",
                                  borderRadius: 3,
                                  background: act.category === "User Activity" 
                                    ? "rgba(59,130,246,0.1)" 
                                    : act.category === "Security Alert"
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(107,114,128,0.1)",
                                  color: act.category === "User Activity"
                                    ? "#2563eb"
                                    : act.category === "Security Alert"
                                    ? "#dc2626"
                                    : "#6b7280",
                                  fontSize: 9,
                                  fontWeight: 500,
                                }}>
                                  {act.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Notifications / Alerts summary card */}
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 cursor-pointer flex flex-col h-56 hover:shadow-md transition-shadow"
              onClick={() => navigate("/admin/notifications")}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-600 dark:text-gray-400 text-xs font-medium m-0">Recent Notifications</h3>
                {unreadNotificationCount > 0 && (
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    {unreadNotificationCount} new
                  </span>
                )}
              </div>
              <div className="mt-2 flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-gray-400 dark:text-gray-500 text-xs">No new notifications</div>
                ) : (
                  notifications.slice(0, 3).map((n, i) => (
                    <div key={i} className="py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <strong className="text-xs text-gray-900 dark:text-gray-100">{n.title}</strong>
                        {n.priority === "critical" && (
                          <span className="px-1 py-0.5 rounded bg-red-600 text-white text-xs font-semibold">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{n.description}</div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="mt-2 text-right">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold cursor-pointer">
                    View All →
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Reports & Analytics */}
          <section
            id="reports-section"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center"
          >
            <h3 className="m-0 text-indigo-600 dark:text-indigo-400">Reports & Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              📈 Chart visualizations and deeper analytics are available here.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
