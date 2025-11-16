import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/adminlogin", { replace: true });
      return;
    }

    // Verify admin access
    const verifyAdmin = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.role !== "admin") {
          navigate("/adminlogin", { replace: true });
          return;
        }

        // Load notifications
        await fetchNotifications(token);
        setLoading(false);
      } catch (err) {
        console.error("❌ Admin verification failed:", err);
        navigate("/adminlogin", { replace: true });
      }
    };

    verifyAdmin();

    // Set up polling for real-time updates (every 10 seconds)
    const interval = setInterval(() => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        fetchNotifications(token);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchNotifications = async (token, page = 1, status = "all", category = "all") => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20, status, category },
      });

      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      setMessage({ type: "error", text: "Failed to load notifications" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleFilter = async () => {
    const token = localStorage.getItem("adminToken");
    await fetchNotifications(token, 1, statusFilter, categoryFilter);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh notifications
      await fetchNotifications(token, currentPage, statusFilter, categoryFilter);
    } catch (err) {
      console.error("❌ Error marking as read:", err);
      setMessage({ type: "error", text: "Failed to update notification" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/notifications/${notificationId}/unread`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh notifications
      await fetchNotifications(token, currentPage, statusFilter, categoryFilter);
    } catch (err) {
      console.error("❌ Error marking as unread:", err);
      setMessage({ type: "error", text: "Failed to update notification" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!confirm("Mark all notifications as read?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        "http://localhost:5000/api/admin/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: "All notifications marked as read" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);

      // Refresh notifications
      await fetchNotifications(token, currentPage, statusFilter, categoryFilter);
    } catch (err) {
      console.error("❌ Error marking all as read:", err);
      setMessage({ type: "error", text: "Failed to update notifications" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: "success", text: "Notification deleted successfully" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);

      // Refresh notifications
      await fetchNotifications(token, currentPage, statusFilter, categoryFilter);
    } catch (err) {
      console.error("❌ Error deleting notification:", err);
      setMessage({ type: "error", text: "Failed to delete notification" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!confirm("Are you sure you want to delete all read notifications?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete("http://localhost:5000/api/admin/notifications/read/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: "success", text: "All read notifications deleted" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);

      // Refresh notifications
      await fetchNotifications(token, currentPage, statusFilter, categoryFilter);
    } catch (err) {
      console.error("❌ Error deleting read notifications:", err);
      setMessage({ type: "error", text: "Failed to delete notifications" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "System Alert":
        return { bg: "rgba(59,130,246,0.1)", color: "#2563eb", icon: "⚠️" };
      case "User Activity":
        return { bg: "rgba(16,185,129,0.1)", color: "#10b981", icon: "👤" };
      case "Error":
        return { bg: "rgba(239,68,68,0.1)", color: "#dc2626", icon: "❌" };
      case "Security Alert":
        return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", icon: "🔒" };
      default:
        return { bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "ℹ️" };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "critical":
        return { bg: "#dc2626", color: "#fff", text: "Critical" };
      case "high":
        return { bg: "#f59e0b", color: "#fff", text: "High" };
      case "medium":
        return { bg: "#3b82f6", color: "#fff", text: "Medium" };
      default:
        return { bg: "#6b7280", color: "#fff", text: "Low" };
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
          fontFamily: "'Montserrat', sans-serif",
          background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
        }}
      >
        <h2 style={{ color: "#111827" }}>Loading Notification Center...</h2>
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
          maxWidth: 1200,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => navigate("/AdminDashboard")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e6e9ef",
                  background: "#fff",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ← Back
              </button>
              <div>
                <h1 style={{ color: "#111827", margin: 0 }}>Notification Center</h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  Manage and monitor system notifications and alerts.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {unreadCount > 0 && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {unreadCount} Unread
                </div>
              )}
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid #e6e9ef",
                  background: "#fff",
                  color: "#4f46e5",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Mark All Read
              </button>
              <button
                onClick={handleDeleteAllRead}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid #e6e9ef",
                  background: "#fff",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete Read
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            style={{
              background: message.type === "success" ? "#d1fae5" : "#fee2e2",
              color: message.type === "success" ? "#065f46" : "#991b1b",
              padding: "12px 20px",
              borderRadius: 10,
              fontWeight: 500,
            }}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 15px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "10px 15px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <option value="all">All Categories</option>
              <option value="System Alert">System Alert</option>
              <option value="User Activity">User Activity</option>
              <option value="Error">Error</option>
              <option value="Security Alert">Security Alert</option>
              <option value="Info">Info</option>
            </select>
            <button
              onClick={handleFilter}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                const token = localStorage.getItem("adminToken");
                fetchNotifications(token, 1, "all", "all");
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                background: "#fff",
                color: "#6b7280",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ color: "#4f46e5", marginTop: 0 }}>Notifications</h2>
          {notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
              No notifications found.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((notification) => {
                  const categoryColors = getCategoryColor(notification.category);
                  const priorityBadge = getPriorityBadge(notification.priority);
                  const isUnread = notification.status === "unread";
                  const isCritical = notification.priority === "critical";

                  return (
                    <div
                      key={notification.id}
                      style={{
                        padding: 20,
                        borderRadius: 12,
                        border: isUnread ? "2px solid #4f46e5" : "1px solid #e6e9ef",
                        background: isUnread ? "#f8faff" : "#fff",
                        boxShadow: isCritical ? "0 4px 12px rgba(220,38,38,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>{categoryColors.icon}</span>
                            <h3
                              style={{
                                margin: 0,
                                color: "#111827",
                                fontWeight: isUnread ? 700 : 600,
                                fontSize: 16,
                              }}
                            >
                              {notification.title}
                            </h3>
                            {isUnread && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  background: "#4f46e5",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                NEW
                              </span>
                            )}
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                background: categoryColors.bg,
                                color: categoryColors.color,
                              }}
                            >
                              {notification.category}
                            </span>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                background: priorityBadge.bg,
                                color: priorityBadge.color,
                              }}
                            >
                              {priorityBadge.text}
                            </span>
                          </div>
                          <p style={{ color: "#6b7280", margin: "8px 0", fontSize: 14, lineHeight: 1.6 }}>
                            {notification.description}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>
                              {formatTime(notification.createdAt)}
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                              {isUnread ? (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #e6e9ef",
                                    background: "#fff",
                                    color: "#4f46e5",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                >
                                  Mark Read
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkAsUnread(notification.id)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #e6e9ef",
                                    background: "#fff",
                                    color: "#6b7280",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                >
                                  Mark Unread
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  border: "1px solid #e6e9ef",
                                  background: "#fff",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
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
                  Page {currentPage} of {totalPages}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("adminToken");
                      if (currentPage > 1) {
                        fetchNotifications(token, currentPage - 1, statusFilter, categoryFilter);
                      }
                    }}
                    disabled={currentPage <= 1}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid #e6e9ef",
                      background: currentPage <= 1 ? "#f9fafb" : "#fff",
                      cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                      color: currentPage <= 1 ? "#9ca3af" : "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("adminToken");
                      if (currentPage < totalPages) {
                        fetchNotifications(token, currentPage + 1, statusFilter, categoryFilter);
                      }
                    }}
                    disabled={currentPage >= totalPages}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid #e6e9ef",
                      background: currentPage >= totalPages ? "#f9fafb" : "#fff",
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                      color: currentPage >= totalPages ? "#9ca3af" : "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

