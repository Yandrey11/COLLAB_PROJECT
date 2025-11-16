import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("user"); // Default to "user" role
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});

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

        // Load initial data - fetch only users with role "user" by default
        await fetchUsers(token, 1, "", "user", "all");
        setLoading(false);
      } catch (err) {
        console.error("❌ Admin verification failed:", err);
        navigate("/adminlogin", { replace: true });
      }
    };

    verifyAdmin();
  }, [navigate]);

  const fetchUsers = async (token, page = 1, search = "", role = "all", status = "all") => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, search, role, status },
      });

      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setMessage({ type: "", text: "" });
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load users";
      setMessage({ type: "error", text: errorMessage });
      setUsers([]);
      setTotalPages(1);
      setCurrentPage(1);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validation
    if (!addForm.name.trim()) errors.name = "Name is required";
    if (!addForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(addForm.email)) {
      errors.email = "Invalid email format";
    }
    if (!addForm.password) {
      errors.password = "Password is required";
    } else if (!validatePassword(addForm.password)) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        "http://localhost:5000/api/admin/users",
        addForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: "User created successfully" });
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", role: "user" });
      setFormErrors({});
      await fetchUsers(token, currentPage, searchQuery, roleFilter, statusFilter);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ Error creating user:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create user",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validation
    if (!editForm.name.trim()) errors.name = "Name is required";
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(editForm.email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser.id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: "User updated successfully" });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormErrors({});
      await fetchUsers(token, currentPage, searchQuery, roleFilter, statusFilter);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ Error updating user:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update user",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };


  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Are you sure you want to permanently delete ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: "success", text: "User deleted successfully" });
      await fetchUsers(token, currentPage, searchQuery, roleFilter, statusFilter);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete user",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validation
    if (!passwordForm.newPassword) {
      errors.newPassword = "Password is required";
    } else if (!validatePassword(passwordForm.newPassword)) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/users/${selectedUser.id}/reset-password`,
        { newPassword: passwordForm.newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({
        type: "success",
        text: "Password reset successfully. User will need to use the new password on next login.",
      });
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setFormErrors({});
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ Error resetting password:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setFormErrors({});
    setShowPasswordModal(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    await fetchUsers(token, 1, searchQuery, roleFilter, statusFilter);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return { bg: "rgba(239,68,68,0.1)", color: "#dc2626" };
      case "counselor":
        return { bg: "rgba(59,130,246,0.1)", color: "#2563eb" };
      default:
        return { bg: "rgba(107,114,128,0.1)", color: "#4b5563" };
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
        <h2 style={{ color: "#111827" }}>Loading User Management...</h2>
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
                <h1 style={{ color: "#111827", margin: 0 }}>User Management</h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  Manage system users, control access, and ensure proper role assignment.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true);
                setAddForm({ name: "", email: "", password: "", role: "user" });
                setFormErrors({});
              }}
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
              + Add New User
            </button>
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

        {/* Search and Filter */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "10px 15px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                outline: "none",
                fontSize: 14,
              }}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                const newRole = e.target.value;
                setRoleFilter(newRole);
                const token = localStorage.getItem("adminToken");
                fetchUsers(token, 1, searchQuery, newRole, statusFilter);
              }}
              style={{
                padding: "10px 15px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="counselor">Counselor</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatusFilter(newStatus);
                const token = localStorage.getItem("adminToken");
                fetchUsers(token, 1, searchQuery, roleFilter, newStatus);
              }}
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
              <option value="active">Active (Online)</option>
              <option value="offline">Offline</option>
            </select>
            <button
              type="submit"
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
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                const token = localStorage.getItem("adminToken");
                setSearchQuery("");
                setRoleFilter("user"); // Reset to "user" role
                setStatusFilter("all");
                fetchUsers(token, 1, "", "user", "all");
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
          </form>
        </div>

        {/* Users Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ color: "#4f46e5", marginTop: 0 }}>All Users</h2>
          {users.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
              No users found.
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #e6e9ef" }}>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Full Name
                      </th>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Email
                      </th>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Role
                      </th>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Online Status
                      </th>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Date Created
                      </th>
                      <th style={{ padding: "12px 8px", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleColors = getRoleBadgeColor(user.role);
                      return (
                        <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "14px 8px", color: "#111827", fontWeight: 500 }}>
                            {user.name}
                          </td>
                          <td style={{ padding: "14px 8px", color: "#6b7280" }}>{user.email}</td>
                          <td style={{ padding: "14px 8px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background: roleColors.bg,
                                color: roleColors.color,
                                textTransform: "capitalize",
                              }}
                            >
                              {user.role === "admin" ? "Admin" : user.role === "counselor" ? "Counselor" : "User"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 8px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background: user.isOnline ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                                color: user.isOnline ? "#10b981" : "#6b7280",
                                textTransform: "capitalize",
                              }}
                            >
                              {user.isOnline ? "Active" : "Offline"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 8px", color: "#6b7280", fontSize: 13 }}>
                            {formatDate(user.createdAt)}
                          </td>
                          <td style={{ padding: "14px 8px" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                onClick={() => openEditModal(user)}
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
                                Edit
                              </button>
                              <button
                                onClick={() => openPasswordModal(user)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  border: "1px solid #e6e9ef",
                                  background: "#fff",
                                  color: "#3b82f6",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: "#ef4444",
                                  color: "#fff",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                        fetchUsers(token, currentPage - 1, searchQuery, roleFilter, statusFilter);
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
                        fetchUsers(token, currentPage + 1, searchQuery, roleFilter, statusFilter);
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

      {/* Add User Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAddModal(false);
            setFormErrors({});
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#4f46e5", marginTop: 0 }}>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.name ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.name && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.name}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.email ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.email && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.email}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.password ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.password && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.password}</p>}
                <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>Minimum 6 characters</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Role *
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                >
                  <option value="user">User</option>
                  <option value="counselor">Counselor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormErrors({});
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowEditModal(false);
            setFormErrors({});
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#4f46e5", marginTop: 0 }}>Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.name ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.name && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.name}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.email ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.email && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.email}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Role *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                >
                  <option value="user">User</option>
                  <option value="counselor">Counselor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormErrors({});
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowPasswordModal(false);
            setFormErrors({});
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#4f46e5", marginTop: 0 }}>Reset Password</h2>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              Reset password for: <strong>{selectedUser.email}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.newPassword ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.newPassword && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.newPassword}</p>
                )}
                <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>Minimum 6 characters</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "#6b7280", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: 10,
                    border: formErrors.confirmPassword ? "1px solid #ef4444" : "1px solid #e6e9ef",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {formErrors.confirmPassword && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.confirmPassword}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setFormErrors({});
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
