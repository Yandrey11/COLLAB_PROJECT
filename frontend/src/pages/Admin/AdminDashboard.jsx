import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Summary & activity
  const [summary, setSummary] = useState({
    totalUsers: "—",
    active: "—",
    inactive: "—",
    recentActivity: [],
  });

  // Notifications (polled)
  const [notifications, setNotifications] = useState([]);
  const notificationsIntervalRef = useRef(null);

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
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("⚠️ No admin token found. Please log in.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        // main verification (do not change endpoint)
        const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
      } catch (err) {
        console.error("❌ Admin verification failed:", err);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Fetch overview/summary (uses a dedicated endpoint if available)
  const fetchSummary = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // expected: { totalUsers, active, inactive, recentActivity: [] }
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
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.warn("Notifications polling failed:", err.message || err);
      }
    };
    // initial fetch
    poll();
    // poll every 10 seconds
    notificationsIntervalRef.current = setInterval(poll, 10000);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #6a11cb, #8e62ff)",
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        Loading Admin Dashboard...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Poppins, sans-serif",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ color: "#c0392b" }}>Access Denied</h2>
        <p>You do not have permission to access the Admin Dashboard. Redirecting...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
        fontFamily: "Poppins, sans-serif",
        color: "#333",
      }}
    >
      {/* Sidebar / Navigation (includes required sections) */}
      <aside
        style={{
          width: "260px",
          background: "linear-gradient(180deg, #4b2edf, #6b4eff)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "700",
            fontSize: "20px",
          }}
        >
          Admin Panel
        </h2>

        <nav style={{ flex: 1 }}>
          {[
            "Overview",
            "User Management",
            "Bookkeeping Entries",
            "Reports & Analytics",
            "Guidance Content Management",
            "System Settings",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 15px",
                margin: "6px 0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "0.2s",
                backgroundColor: item === "Overview" ? "rgba(255,255,255,0.12)" : "transparent",
              }}
              onClick={() => {
                // simple client-side routing placeholders; replace with real routes as needed
                if (item === "User Management") {
                  document.getElementById("users-section")?.scrollIntoView({ behavior: "smooth" });
                } else if (item === "Overview") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  alert(`${item} clicked — navigate to the appropriate management page.`);
                }
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor =
                  item === "Overview" ? "rgba(255,255,255,0.12)" : "transparent")
              }
            >
              {item}
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ff4b4b",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "auto",
          }}
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#f8f8ff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            background: "#fff",
            padding: "15px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <form onSubmit={handleUsersSearch} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search users or entries..."
              value={usersQuery}
              onChange={(e) => setUsersQuery(e.target.value)}
              style={{
                padding: "10px 15px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                width: "300px",
                outline: "none",
              }}
            />
            <select
              value={usersStatusFilter}
              onChange={(e) => setUsersStatusFilter(e.target.value)}
              style={{ padding: "10px", borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approvals</option>
            </select>
            <button
              type="submit"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#6b4eff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* notifications summary */}
            <div
              title="Notifications"
              style={{
                position: "relative",
                cursor: "pointer",
                padding: "6px 8px",
                background: "#f5f5f7",
                borderRadius: 8,
              }}
            >
              🔔
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ff4b4b",
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
                  {notifications.length}
                </span>
              )}
            </div>

            {admin && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#f0f0f0",
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
                      width="18"
                      height="18"
                      fill="#777"
                    >
                      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
                    </svg>
                  )}
                </div>
                <span style={{ fontWeight: "600", color: "#555" }}>{admin.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Overview / Summary */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            padding: "30px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#666", fontSize: "14px", fontWeight: "500" }}>Total Users</h3>
            <p style={{ color: "#6b4eff", fontSize: "26px", fontWeight: "700", marginTop: "10px" }}>
              {summary.totalUsers}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#666", fontSize: "14px", fontWeight: "500" }}>Active / Inactive</h3>
            <p style={{ color: "#22bb33", fontSize: "20px", fontWeight: "700", marginTop: "10px" }}>
              {summary.active} active · {summary.inactive} inactive
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#666", fontSize: "14px", fontWeight: "500" }}>Recent Activity</h3>
            <div style={{ marginTop: 10, color: "#777", maxHeight: 120, overflowY: "auto" }}>
              {summary.recentActivity && summary.recentActivity.length > 0 ? (
                summary.recentActivity.map((act, idx) => (
                  <div key={idx} style={{ padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
                    <div style={{ fontSize: 13, color: "#444" }}>{act.title || act.message}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{act.time || act.timestamp}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: "#aaa" }}>No recent activity</div>
              )}
            </div>
          </div>

          {/* Notifications / Alerts summary card */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#666", fontSize: "14px", fontWeight: "500" }}>Alerts & Pending</h3>
            <div style={{ marginTop: 10 }}>
              {notifications.length === 0 ? (
                <div style={{ color: "#aaa" }}>No alerts</div>
              ) : (
                notifications.slice(0, 5).map((n, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px dashed #f2f2f2" }}>
                    <strong style={{ fontSize: 13 }}>{n.title}</strong>
                    <div style={{ fontSize: 12, color: "#777" }}>{n.detail || n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Users management section: search / filter / paginate */}
        <section
          id="users-section"
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            margin: "0 30px 30px",
            padding: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "10px", fontWeight: "600" }}>User Management</h3>
          <p style={{ color: "#777", marginTop: 0 }}>
            Search, filter and paginate through users. Use controls in the top bar to refine results.
          </p>

          <div style={{ marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "8px 6px" }}>Name</th>
                  <th style={{ padding: "8px 6px" }}>Email</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                  <th style={{ padding: "8px 6px" }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 12, color: "#999" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id || u._id} style={{ borderBottom: "1px solid #fafafa" }}>
                      <td style={{ padding: "10px 6px" }}>{u.name}</td>
                      <td style={{ padding: "10px 6px" }}>{u.email}</td>
                      <td style={{ padding: "10px 6px" }}>{u.status || u.accountStatus || "—"}</td>
                      <td style={{ padding: "10px 6px" }}>{new Date(u.createdAt || u.registeredAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* pagination controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div style={{ color: "#777" }}>
                Page {usersPage} of {usersTotalPages}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleUsersPage(usersPage - 1)}
                  disabled={usersPage <= 1}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: usersPage <= 1 ? "#f5f5f5" : "#fff",
                    cursor: usersPage <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => handleUsersPage(usersPage + 1)}
                  disabled={usersPage >= usersTotalPages}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: usersPage >= usersTotalPages ? "#f5f5f5" : "#fff",
                    cursor: usersPage >= usersTotalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Chart placeholder / Reports */}
        <section
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            margin: "0 30px 30px",
            padding: "30px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "10px", fontWeight: "600" }}>Reports & Analytics</h3>
          <p style={{ color: "#777" }}>📈 Chart visualizations and deeper analytics are available here.</p>
        </section>
      </main>
    </div>
  );
}
