import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/admin/records";

export default function AdminRecordManagement() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [admin, setAdmin] = useState(null);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all");
  const [counselorFilter, setCounselorFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Available counselors for filter
  const [counselors, setCounselors] = useState([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    clientName: "",
    date: "",
    sessionType: "",
    sessionNumber: "",
    status: "Ongoing",
    notes: "",
    outcomes: "",
  });

  // Loading states
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    // Verify admin access
    axios
      .get("http://localhost:5000/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.role !== "admin") {
          navigate("/adminlogin");
          return;
        }
        setAdmin(res.data);
        fetchRecords();
      })
      .catch(() => {
        navigate("/adminlogin");
      });
  }, [navigate]);

  // Fetch records with current filters and pagination
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = {
        page: currentPage,
        limit: pageSize,
        search,
        status: statusFilter,
        sessionType: sessionTypeFilter,
        counselor: counselorFilter,
        startDate,
        endDate,
        sortBy,
        order: sortOrder,
      };

      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setRecords(res.data.records || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
      setCounselors(res.data.filters?.counselors || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      alert("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchRecords();
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize, statusFilter, sessionTypeFilter, counselorFilter, startDate, endDate, sortBy, sortOrder]);

  // View record details
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Edit record
  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditForm({
      clientName: record.clientName || "",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      sessionType: record.sessionType || "",
      sessionNumber: record.sessionNumber || "",
      status: record.status || "Ongoing",
      notes: record.notes || "",
      outcomes: record.outcomes || "",
    });
    setShowEditModal(true);
  };

  // Save edited record
  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");
      await axios.put(`${API_URL}/${selectedRecord._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Record updated successfully!");
      setShowEditModal(false);
      fetchRecords();
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  // Delete record
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${API_URL}/${recordToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Record deleted successfully!");
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async (record) => {
    try {
      setGeneratingPDF(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_URL}/${record._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${record.clientName}_record_${record._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Upload to Google Drive
  const handleUploadToDrive = async (record) => {
    try {
      setUploadingToDrive(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${API_URL}/${record._id}/upload-drive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`PDF uploaded to Google Drive successfully! Link: ${res.data.driveLink}`);
      fetchRecords();
    } catch (error) {
      console.error("Error uploading to Drive:", error);
      alert(error.response?.data?.message || "Failed to upload to Google Drive");
    } finally {
      setUploadingToDrive(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSessionTypeFilter("all");
    setCounselorFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Ongoing":
        return "bg-blue-100 text-blue-800";
      case "Referred":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && records.length === 0) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <div style={{ color: "white", fontSize: "20px" }}>Loading records...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            background: "white",
            padding: "20px 30px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0, color: "#1a202c" }}>
              Record Management
            </h1>
            <p style={{ margin: "5px 0 0 0", color: "#718096" }}>
              Manage all counseling records
            </p>
          </div>
          <button
            onClick={() => navigate("/admindashboard")}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
            {/* Search */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Client name or counselor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="all">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Referred">Referred</option>
              </select>
            </div>

            {/* Session Type Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Session Type
              </label>
              <input
                type="text"
                placeholder="Session type..."
                value={sessionTypeFilter === "all" ? "" : sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value || "all")}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Counselor Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Counselor
              </label>
              <select
                value={counselorFilter}
                onChange={(e) => setCounselorFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="all">All Counselors</option>
                {counselors.map((counselor) => (
                  <option key={counselor} value={counselor}>
                    {counselor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
            {/* Date Range */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Sort */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="date">Date</option>
                <option value="clientName">Client Name</option>
                <option value="counselor">Counselor</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={handleClearFilters}
              style={{
                padding: "10px 20px",
                background: "#e2e8f0",
                color: "#4a5568",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#1a202c" }}>
              Records ({totalRecords})
            </h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontWeight: "600", color: "#4a5568" }}>Page Size:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>Loading records...</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>No records found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f7fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Client</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Session</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Type</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4a5568" }}>Counselor</th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#4a5568" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record._id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px", color: "#2d3748" }}>{record.clientName}</td>
                      <td style={{ padding: "12px", color: "#2d3748" }}>{formatDate(record.date)}</td>
                      <td style={{ padding: "12px", color: "#2d3748" }}>#{record.sessionNumber}</td>
                      <td style={{ padding: "12px", color: "#2d3748" }}>{record.sessionType}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          className={getStatusColor(record.status)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#2d3748" }}>{record.counselor}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleViewRecord(record)}
                            style={{
                              padding: "6px 12px",
                              background: "#4299e1",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditRecord(record)}
                            style={{
                              padding: "6px 12px",
                              background: "#48bb78",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record)}
                            style={{
                              padding: "6px 12px",
                              background: "#f56565",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleGeneratePDF(record)}
                            disabled={generatingPDF}
                            style={{
                              padding: "6px 12px",
                              background: generatingPDF ? "#cbd5e0" : "#9f7aea",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: generatingPDF ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleUploadToDrive(record)}
                            disabled={uploadingToDrive}
                            style={{
                              padding: "6px 12px",
                              background: uploadingToDrive ? "#cbd5e0" : "#ed8936",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: uploadingToDrive ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Drive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 16px",
                  background: currentPage === 1 ? "#e2e8f0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: currentPage === 1 ? "#a0aec0" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                Previous
              </button>
              <span style={{ color: "#4a5568", fontWeight: "600" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 16px",
                  background: currentPage === totalPages ? "#e2e8f0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: currentPage === totalPages ? "#a0aec0" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              padding: "20px",
            }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#1a202c" }}>
                  Record Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#718096",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gap: "15px" }}>
                <div>
                  <strong style={{ color: "#4a5568" }}>Client Name:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748" }}>{selectedRecord.clientName}</div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Date:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748" }}>{formatDate(selectedRecord.date)}</div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Session Type:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748" }}>{selectedRecord.sessionType}</div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Session Number:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748" }}>#{selectedRecord.sessionNumber}</div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Status:</strong>
                  <div style={{ marginTop: "5px" }}>
                    <span
                      className={getStatusColor(selectedRecord.status)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Counselor:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748" }}>{selectedRecord.counselor}</div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Notes:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748", whiteSpace: "pre-wrap" }}>
                    {selectedRecord.notes || "No notes"}
                  </div>
                </div>
                <div>
                  <strong style={{ color: "#4a5568" }}>Outcomes:</strong>
                  <div style={{ marginTop: "5px", color: "#2d3748", whiteSpace: "pre-wrap" }}>
                    {selectedRecord.outcomes || "No outcomes"}
                  </div>
                </div>
                {selectedRecord.driveLink && (
                  <div>
                    <strong style={{ color: "#4a5568" }}>Google Drive Link:</strong>
                    <div style={{ marginTop: "5px" }}>
                      <a
                        href={selectedRecord.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#4299e1", textDecoration: "underline" }}
                      >
                        View in Google Drive
                      </a>
                    </div>
                  </div>
                )}
                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div>
                    <strong style={{ color: "#4a5568" }}>Attachments:</strong>
                    <div style={{ marginTop: "5px" }}>
                      {selectedRecord.attachments.map((attachment, idx) => (
                        <div key={idx} style={{ marginBottom: "5px" }}>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#4299e1", textDecoration: "underline" }}
                          >
                            {attachment.fileName}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRecord.auditTrail && (
                  <div>
                    <strong style={{ color: "#4a5568" }}>Audit Trail:</strong>
                    <div style={{ marginTop: "5px", fontSize: "14px", color: "#2d3748" }}>
                      <div>Created by: {selectedRecord.auditTrail.createdBy?.userName || "N/A"}</div>
                      <div>Created at: {formatDate(selectedRecord.auditTrail.createdAt)}</div>
                      <div>Last modified by: {selectedRecord.auditTrail.lastModifiedBy?.userName || "N/A"}</div>
                      <div>Last modified at: {formatDate(selectedRecord.auditTrail.lastModifiedAt)}</div>
                      {selectedRecord.auditTrail.modificationHistory &&
                        selectedRecord.auditTrail.modificationHistory.length > 0 && (
                          <div style={{ marginTop: "10px" }}>
                            <strong>Modification History:</strong>
                            {selectedRecord.auditTrail.modificationHistory.map((change, idx) => (
                              <div key={idx} style={{ marginTop: "5px", paddingLeft: "10px", fontSize: "12px" }}>
                                {change.field}: {String(change.oldValue)} → {String(change.newValue)} (by{" "}
                                {change.changedBy?.userName || "N/A"} on {formatDate(change.changedAt)})
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditRecord(selectedRecord);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#48bb78",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#e2e8f0",
                    color: "#4a5568",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              padding: "20px",
            }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px", color: "#1a202c" }}>
                Edit Record
              </h2>

              <div style={{ display: "grid", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Session Type *
                  </label>
                  <input
                    type="text"
                    value={editForm.sessionType}
                    onChange={(e) => setEditForm({ ...editForm, sessionType: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Session Number
                  </label>
                  <input
                    type="number"
                    value={editForm.sessionNumber}
                    onChange={(e) => setEditForm({ ...editForm, sessionNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Referred">Referred</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Outcomes
                  </label>
                  <textarea
                    value={editForm.outcomes}
                    onChange={(e) => setEditForm({ ...editForm, outcomes: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#e2e8f0",
                    color: "#4a5568",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? "#cbd5e0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && recordToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "15px", color: "#1a202c" }}>
                Confirm Deletion
              </h2>
              <p style={{ color: "#4a5568", marginBottom: "20px" }}>
                Are you sure you want to delete the record for <strong>{recordToDelete.clientName}</strong> - Session{" "}
                #{recordToDelete.sessionNumber}? This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRecordToDelete(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#e2e8f0",
                    color: "#4a5568",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{
                    padding: "10px 20px",
                    background: deleting ? "#cbd5e0" : "#f56565",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: deleting ? "not-allowed" : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

