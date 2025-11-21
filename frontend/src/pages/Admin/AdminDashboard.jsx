import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminSidebar from "../../components/AdminSidebar";

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

  // Users list: search / filter / paginate
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersQuery, setUsersQuery] = useState("");
  const [usersStatusFilter, setUsersStatusFilter] = useState("all");
  const usersLimit = 10;

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

        // fetch summary, users and start notifications polling
        await Promise.all([fetchSummary(token), fetchUsers(token, 1, usersQuery, usersStatusFilter)]);
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

  // Users fetch with pagination, search and filter
  const fetchUsers = async (token, page = 1, q = "", status = "all") => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: usersLimit, q, status },
      });
      // expected: { users: [], totalPages: n }
      setUsers(res.data.users || []);
      setUsersTotalPages(res.data.totalPages || 1);
      setUsersPage(page);
    } catch (err) {
      console.warn("Could not fetch users:", err.message || err);
      setUsers([]);
      setUsersTotalPages(1);
      setUsersPage(1);
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

  // handlers for users search/filter/pagination
  const handleUsersSearch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    await fetchUsers(token, 1, usersQuery, usersStatusFilter);
  };

  const handleUsersPage = async (newPage) => {
    const token = localStorage.getItem("adminToken");
    if (newPage < 1 || newPage > usersTotalPages) return;
    await fetchUsers(token, newPage, usersQuery, usersStatusFilter);
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
          maxWidth: 1400,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 24,
        }}
      >
        {/* Left: Overview / Navigation */}
        <AdminSidebar />

        {/* Right: Main content */}
        <main>
          {/* Welcome Header */}
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
                  Welcome{admin?.name ? `, ${admin.name}` : ""} 🎉
                </h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  Manage users, monitor system activity, and access administrative tools.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {/* Notifications summary */}
                <div
                  title="Notifications"
                  onClick={() => navigate("/admin/notifications")}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    padding: "8px 12px",
                    background: "#f5f5f7",
                    borderRadius: 10,
                    fontSize: 18,
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#eef2ff")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                >
                  🔔
                  {unreadNotificationCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "#ef4444",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </div>

                {admin && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {admin.avatar ? (
                        <img
                          src={admin.avatar}
                          alt="profile"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="#4f46e5"
                        >
                          <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
                        </svg>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>Admin Account</div>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{admin.name || "—"}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          

          {/* Overview / Summary Cards */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                padding: 20,
              }}
            >
              <h3 style={{ color: "#6b7280", fontSize: 14, fontWeight: 500, margin: 0 }}>Total Users</h3>
              <p style={{ color: "#4f46e5", fontSize: 32, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>
                {summary.totalUsers}
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                <span>
                  <strong style={{ color: "#dc2626" }}>{summary.totalAdmins}</strong> Admin{summary.totalAdmins !== "—" && summary.totalAdmins !== 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>
                  <strong style={{ color: "#2563eb" }}>{summary.totalCounselors}</strong> Counselor{summary.totalCounselors !== "—" && summary.totalCounselors !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                padding: 20,
              }}
            >
              <h3 style={{ color: "#6b7280", fontSize: 14, fontWeight: 500, margin: 0 }}>Active / Inactive</h3>
              <p style={{ color: "#10b981", fontSize: 24, fontWeight: 700, marginTop: 10, marginBottom: 0 }}>
                {summary.active} active · {summary.inactive} inactive
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                padding: 20,
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              <h3 style={{ color: "#6b7280", fontSize: 14, fontWeight: 500, margin: 0, marginBottom: 12 }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {summary.recentActivity && summary.recentActivity.length > 0 ? (
                  summary.recentActivity.map((act) => (
                    <div 
                      key={act.id || act.timestamp} 
                      style={{ 
                        padding: "10px 12px", 
                        borderBottom: "1px solid #f3f4f6",
                        borderRadius: 8,
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
                            fontSize: 13, 
                            color: "#111827", 
                            fontWeight: 600,
                            marginBottom: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}>
                            {act.title || act.message}
                            {(act.priority === "high" || act.priority === "critical") && (
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "#dc2626",
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {act.priority === "critical" ? "Critical" : "High"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                            {act.description}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            color: "#9ca3af", 
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}>
                            <span>{act.time || new Date(act.timestamp).toLocaleString()}</span>
                            {act.category && (
                              <>
                                <span>·</span>
                                <span style={{ 
                                  padding: "2px 6px",
                                  borderRadius: 4,
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
                                  fontSize: 10,
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
                  <div style={{ 
                    fontSize: 13, 
                    color: "#9ca3af", 
                    textAlign: "center",
                    padding: "20px 0",
                  }}>
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Notifications / Alerts summary card */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                padding: 20,
                cursor: "pointer",
              }}
              onClick={() => navigate("/admin/notifications")}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 10px 25px rgba(79,70,229,0.15)")}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.06)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ color: "#6b7280", fontSize: 14, fontWeight: 500, margin: 0 }}>Recent Notifications</h3>
                {unreadNotificationCount > 0 && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {unreadNotificationCount} new
                  </span>
                )}
              </div>
              <div style={{ marginTop: 10 }}>
                {notifications.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>No new notifications</div>
                ) : (
                  notifications.slice(0, 3).map((n, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px dashed #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: "#111827" }}>{n.title}</strong>
                        {n.priority === "critical" && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            Critical
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{n.description}</div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div style={{ marginTop: 10, textAlign: "right" }}>
                  <span style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    View All →
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Users management section */}
          <section
            id="users-section"
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#4f46e5" }}>User Management</h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                Search, filter and paginate through users. Use controls above to refine results.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e6e9ef" }}>
                    <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>Name</th>
                    <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>Email</th>
                    <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 24, color: "#9ca3af", textAlign: "center" }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id || u._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 8px", color: "#111827", fontWeight: 500 }}>{u.name}</td>
                        <td style={{ padding: "14px 8px", color: "#6b7280" }}>{u.email}</td>
                        <td style={{ padding: "14px 8px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background:
                                (u.status || u.accountStatus) === "active"
                                  ? "rgba(16,185,129,0.08)"
                                  : (u.status || u.accountStatus) === "pending"
                                  ? "rgba(245,158,11,0.08)"
                                  : "rgba(148,163,184,0.06)",
                              color:
                                (u.status || u.accountStatus) === "active"
                                  ? "#065f46"
                                  : (u.status || u.accountStatus) === "pending"
                                  ? "#92400e"
                                  : "#374151",
                            }}
                          >
                            {u.status || u.accountStatus || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px", color: "#6b7280", fontSize: 13 }}>
                          {new Date(u.createdAt || u.registeredAt || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  Page {usersPage} of {usersTotalPages}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleUsersPage(usersPage - 1)}
                    disabled={usersPage <= 1}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid #e6e9ef",
                      background: usersPage <= 1 ? "#f9fafb" : "#fff",
                      cursor: usersPage <= 1 ? "not-allowed" : "pointer",
                      color: usersPage <= 1 ? "#9ca3af" : "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => handleUsersPage(usersPage + 1)}
                    disabled={usersPage >= usersTotalPages}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid #e6e9ef",
                      background: usersPage >= usersTotalPages ? "#f9fafb" : "#fff",
                      cursor: usersPage >= usersTotalPages ? "not-allowed" : "pointer",
                      color: usersPage >= usersTotalPages ? "#9ca3af" : "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Reports & Analytics */}
          <section
            id="reports-section"
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: 0, color: "#4f46e5" }}>Reports & Analytics</h3>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              📈 Chart visualizations and deeper analytics are available here.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
