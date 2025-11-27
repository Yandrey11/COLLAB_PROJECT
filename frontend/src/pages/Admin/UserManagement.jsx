import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminSidebar from "../../components/AdminSidebar";
import { initializeTheme } from "../../utils/themeUtils";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function UserManagement() {
  useDocumentTitle("Admin User Management");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("counselor"); // Default to counselor role
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "counselor",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "counselor",
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

        // Load initial data - fetch counselors by default
        await fetchUsers(token, 1, "", "counselor", "all");
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

      setMessage({ type: "success", text: res.data.message || "User created successfully. Password setup link has been sent to their email." });
      setShowAddModal(false);
      setAddForm({ name: "", email: "", role: "counselor" });
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
    const result = await Swal.fire({
      title: "Delete User?",
      html: `Are you sure you want to permanently delete <strong>${email}</strong>?<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
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

  const handleSendResetLink = async (user) => {
    const result = await Swal.fire({
      title: "Send Reset Link?",
      text: `Send password reset link to ${user.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, send link",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `http://localhost:5000/api/admin/users/${user.id}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({
        type: "success",
        text: res.data.message || "Password reset link has been sent to the user's email.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } catch (err) {
      console.error("❌ Error sending reset link:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to send password reset link",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <AdminSidebar />

        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">User Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                  Manage system users, control access, and ensure proper role assignment.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setAddForm({ name: "", email: "", role: "counselor" });
                  setFormErrors({});
                }}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-sm cursor-pointer transition-all shadow-md hover:shadow-lg"
              >
                + Add New User
              </button>
            </div>
          </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`px-5 py-3 rounded-lg font-medium text-sm ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-3 items-center flex-wrap">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <select
                value={roleFilter}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setRoleFilter(newRole);
                  const token = localStorage.getItem("adminToken");
                  fetchUsers(token, 1, searchQuery, newRole, statusFilter);
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-indigo-600 dark:bg-indigo-600 text-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="counselor">Counselor</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setStatusFilter(newStatus);
                  const token = localStorage.getItem("adminToken");
                  fetchUsers(token, 1, searchQuery, roleFilter, newStatus);
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-indigo-600 dark:bg-indigo-600 text-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active (Online)</option>
                <option value="offline">Offline</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-sm cursor-pointer transition-all shadow-md hover:shadow-lg"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  const token = localStorage.getItem("adminToken");
                  setSearchQuery("");
                  setRoleFilter("counselor");
                  setStatusFilter("all");
                  fetchUsers(token, 1, "", "counselor", "all");
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">All Users</h2>
          {users.length === 0 ? (
            <div className="py-10 text-center text-gray-400 dark:text-gray-500">
              No users found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Full Name
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Email
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Role
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Online Status
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Date Created
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleColors = getRoleBadgeColor(user.role);
                      return (
                        <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </td>
                          <td className="px-3 py-3.5 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                                user.role === "admin"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {user.role === "admin" ? "Admin" : "Counselor"}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                                user.isOnline
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
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
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleSendResetLink(user)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 cursor-pointer font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                Send Reset Link
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs cursor-pointer transition-colors"
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
                      className: `border border-gray-200 dark:border-gray-700 ${currentPage <= 1 ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-700 cursor-pointer"}`,
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
                      className: `border border-gray-200 dark:border-gray-700 ${currentPage >= totalPages ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-700 cursor-pointer"}`,
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

      {/* Close grid container */}
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
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md"
            style={{
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
                <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                  A password setup link will be sent to the user's email address.
                </p>
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
                    className: "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer font-semibold hover:bg-gray-50 dark:hover:bg-gray-600",
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
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md"
            style={{
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
                    className: "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer font-semibold hover:bg-gray-50 dark:hover:bg-gray-600",
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
