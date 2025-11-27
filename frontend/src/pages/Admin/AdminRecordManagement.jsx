import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminSidebar from "../../components/AdminSidebar";
import { initializeTheme } from "../../utils/themeUtils";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const API_URL = "http://localhost:5000/api/admin/records";

export default function AdminRecordManagement() {
  useDocumentTitle("Admin Record Management");
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
  const [showFilters, setShowFilters] = useState(false);

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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lock management state
  const [lockStatuses, setLockStatuses] = useState({}); // { recordId: { locked, lockedBy, canLock, canUnlock, isLockOwner } }
  const [lockingRecordId, setLockingRecordId] = useState(null);
  const [unlockingRecordId, setUnlockingRecordId] = useState(null);
  const [showLockLogs, setShowLockLogs] = useState(false);
  const [lockLogs, setLockLogs] = useState([]);
  const [selectedRecordForLogs, setSelectedRecordForLogs] = useState(null);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch records",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch lock status for a record
  const fetchLockStatus = async (recordId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_URL}/${recordId}/lock-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLockStatuses((prev) => ({
        ...prev,
        [recordId]: response.data,
      }));
      
      return response.data;
    } catch (error) {
      console.error("Error fetching lock status:", error);
      // If lock status endpoint doesn't exist yet, assume unlocked
      setLockStatuses((prev) => ({
        ...prev,
        [recordId]: { locked: false, canLock: true, canUnlock: false, isLockOwner: false },
      }));
      return { locked: false, canLock: true, canUnlock: false, isLockOwner: false };
    }
  };

  // Fetch all lock statuses when records are loaded
  useEffect(() => {
    if (records.length > 0) {
      records.forEach((record) => {
        fetchLockStatus(record._id);
      });
    }
  }, [records]);

  // Fetch lock logs for a record
  const fetchLockLogs = async (recordId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_URL}/${recordId}/lock-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLockLogs(response.data.logs || []);
      return response.data.logs || [];
    } catch (error) {
      console.error("Error fetching lock logs:", error);
      setLockLogs([]);
      return [];
    }
  };

  // Lock a record
  const handleLockRecord = async (record) => {
    try {
      setLockingRecordId(record._id);
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(`${API_URL}/${record._id}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        await fetchLockStatus(record._id);
        Swal.fire({
          icon: "success",
          title: "Record Locked",
          text: "Record has been locked successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchRecords(); // Refresh to get updated lock info
      }
    } catch (error) {
      console.error("Error locking record:", error);
      const errorMessage = error.response?.data?.message || "Failed to lock record.";
      Swal.fire({
        icon: "error",
        title: "Lock Failed",
        text: errorMessage,
      });
    } finally {
      setLockingRecordId(null);
    }
  };

  // Unlock a record
  const handleUnlockRecord = async (record) => {
    try {
      setUnlockingRecordId(record._id);
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(`${API_URL}/${record._id}/unlock`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        await fetchLockStatus(record._id);
        Swal.fire({
          icon: "success",
          title: "Record Unlocked",
          text: "Record has been unlocked successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchRecords(); // Refresh to get updated lock info
      }
    } catch (error) {
      console.error("Error unlocking record:", error);
      const errorMessage = error.response?.data?.message || "Failed to unlock record.";
      Swal.fire({
        icon: "error",
        title: "Unlock Failed",
        text: errorMessage,
      });
    } finally {
      setUnlockingRecordId(null);
    }
  };

  // View lock logs
  const handleViewLockLogs = async (record) => {
    setSelectedRecordForLogs(record);
    setShowLockLogs(true);
    await fetchLockLogs(record._id);
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

  // Edit record - check lock status first
  const handleEditRecord = async (record) => {
    // Fetch latest lock status
    const lockStatus = await fetchLockStatus(record._id);
    
    // Check if record is locked by someone else
    if (lockStatus.locked && !lockStatus.isLockOwner) {
      Swal.fire({
        icon: "warning",
        title: "Record Locked",
        text: `This record is locked by ${lockStatus.lockedBy?.userName || "another user"}. You cannot edit it.`,
      });
      return;
    }

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
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Record updated successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      setShowEditModal(false);
      fetchRecords();
    } catch (error) {
      console.error("Error updating record:", error);
      // Handle 423 Locked status
      if (error.response?.status === 423) {
        Swal.fire({
          icon: "warning",
          title: "Record Locked",
          text: error.response?.data?.message || "This record is locked by another user. You cannot edit it.",
        });
        await fetchLockStatus(selectedRecord._id);
        setShowEditModal(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update record",
        });
      }
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
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Record deleted successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete record",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Upload/Download of PDFs for admin have been removed

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

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <AdminSidebar />

        <div className="flex flex-col gap-5">
          {/* Header */}
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">Record Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
              Manage all counseling records.
            </p>
          </div>
        </motion.div>

        {/* Search Bar - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm"
        >
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search
              </label>
              <input
                type="text"
                placeholder="Client name or counselor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2"
            >
              {showFilters ? (
                <>
                  <span>Hide Filters</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Show Filters</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Filters - Collapsible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Referred">Referred</option>
                    </select>
                  </div>

                  {/* Session Type Filter */}
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Session Type
                    </label>
                    <input
                      type="text"
                      placeholder="Session type..."
                      value={sessionTypeFilter === "all" ? "" : sessionTypeFilter}
                      onChange={(e) => setSessionTypeFilter(e.target.value || "all")}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Counselor Filter */}
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Counselor
                    </label>
                    <select
                      value={counselorFilter}
                      onChange={(e) => setCounselorFilter(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Date Range */}
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                    >
                      <option value="date">Date</option>
                      <option value="clientName">Client Name</option>
                      <option value="counselor">Counselor</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm cursor-pointer transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold m-0 text-gray-900 dark:text-gray-100">
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Client</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Session</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Counselor</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Lock Status</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{record.clientName}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(record.date)}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">#{record.sessionNumber}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{record.sessionType}</td>
                      <td className="px-3 py-3">
                        <span className={`${getStatusColor(record.status)} px-3 py-1 rounded-full text-xs font-semibold`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">{record.counselor}</td>
                      <td className="px-3 py-3">
                        {(() => {
                          const lockStatus = lockStatuses[record._id];
                          if (!lockStatus) {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                Loading...
                              </span>
                            );
                          }
                          if (lockStatus.locked) {
                            const isOwner = lockStatus.isLockOwner;
                            return (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isOwner
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  }`}
                                >
                                  🔒 Locked by {lockStatus.lockedBy?.userName || "Unknown"}
                                </span>
                                {lockStatus.lockedBy?.userRole === "admin" && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              🔓 Unlocked
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex gap-1.5 justify-center flex-wrap">
                          <button
                            onClick={() => handleViewRecord(record)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs cursor-pointer transition-colors"
                          >
                            View
                          </button>
                          {(() => {
                            const lockStatus = lockStatuses[record._id];
                            const isLocked = lockStatus?.locked;
                            const isLockOwner = lockStatus?.isLockOwner;
                            const canEdit = !isLocked || isLockOwner;
                            
                            return (
                              <>
                                <button
                                  onClick={() => handleEditRecord(record)}
                                  disabled={!canEdit}
                                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs cursor-pointer transition-colors ${
                                    canEdit
                                      ? "bg-green-500 hover:bg-green-600 text-white"
                                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                  }`}
                                  title={!canEdit ? "Record is locked. Please unlock it first." : "Edit record"}
                                >
                                  Edit
                                </button>
                                {!isLocked || isLockOwner ? (
                                  !isLocked ? (
                                    <button
                                      onClick={() => handleLockRecord(record)}
                                      disabled={lockingRecordId === record._id}
                                      className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      {lockingRecordId === record._id ? "Locking..." : "🔒 Lock"}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnlockRecord(record)}
                                      disabled={unlockingRecordId === record._id}
                                      className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      {unlockingRecordId === record._id ? "Unlocking..." : "🔓 Unlock"}
                                    </button>
                                  )
                                ) : null}
                                <button
                                  onClick={() => handleViewLockLogs(record)}
                                  className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs cursor-pointer transition-colors"
                                  title="View lock history"
                                >
                                  📋 Logs
                                </button>
                              </>
                            );
                          })()}
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
            <div className="flex justify-center items-center gap-2.5 mt-5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === 1
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white cursor-pointer shadow-md hover:shadow-lg"
                }`}
              >
                Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === totalPages
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white cursor-pointer shadow-md hover:shadow-lg"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Close grid container */}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#1a202c" }}>
                    Edit Record
                  </h2>
                  {(() => {
                    const lockStatus = lockStatuses[selectedRecord?._id];
                    if (lockStatus?.locked) {
                      const isOwner = lockStatus.isLockOwner;
                      return (
                        <div className="mt-2">
                          {isOwner ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              🔒 You have locked this record
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              🔒 Locked by {lockStatus.lockedBy?.userName || "another user"} - Read Only
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
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

              {(() => {
                const lockStatus = lockStatuses[selectedRecord?._id];
                const isLocked = lockStatus?.locked;
                const isLockOwner = lockStatus?.isLockOwner;
                const isReadOnly = isLocked && !isLockOwner;
                
                return (
                  <div style={{ display: "grid", gap: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                        Client Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.clientName}
                        disabled
                        readOnly
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: "#f7fafc",
                      color: "#718096",
                      cursor: "not-allowed",
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
                    disabled
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: "#f7fafc",
                      color: "#718096",
                      cursor: "not-allowed",
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
                    disabled
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: "#f7fafc",
                      color: "#718096",
                      cursor: "not-allowed",
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
                    disabled
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: "#f7fafc",
                      color: "#718096",
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Status *
                  </label>
                  <select
                    value={editForm.status}
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: "#f7fafc",
                      color: "#718096",
                      cursor: "not-allowed",
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
                    disabled={(() => {
                      const lockStatus = lockStatuses[selectedRecord?._id];
                      return lockStatus?.locked && !lockStatus?.isLockOwner;
                    })()}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                    style={{ resize: "vertical" }}
                    placeholder={(() => {
                      const lockStatus = lockStatuses[selectedRecord?._id];
                      if (lockStatus?.locked && !lockStatus?.isLockOwner) {
                        return "Record is locked. Please unlock it first.";
                      }
                      return "";
                    })()}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#4a5568" }}>
                    Outcomes
                  </label>
                  <textarea
                    value={editForm.outcomes}
                    onChange={(e) => setEditForm({ ...editForm, outcomes: e.target.value })}
                    disabled={(() => {
                      const lockStatus = lockStatuses[selectedRecord?._id];
                      return lockStatus?.locked && !lockStatus?.isLockOwner;
                    })()}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                    style={{ resize: "vertical" }}
                    placeholder={(() => {
                      const lockStatus = lockStatuses[selectedRecord?._id];
                      if (lockStatus?.locked && !lockStatus?.isLockOwner) {
                        return "Record is locked. Please unlock it first.";
                      }
                      return "";
                    })()}
                  />
                </div>
                  </div>
                );
              })()}

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
                {(() => {
                  const lockStatus = lockStatuses[selectedRecord?._id];
                  const isLocked = lockStatus?.locked;
                  const isLockOwner = lockStatus?.isLockOwner;
                  const canEdit = !isLocked || isLockOwner;
                  
                  return (
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !canEdit}
                      style={{
                        padding: "10px 20px",
                        background: saving || !canEdit ? "#cbd5e0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: saving || !canEdit ? "not-allowed" : "pointer",
                        fontWeight: "600",
                      }}
                      title={!canEdit ? "Record is locked. Please unlock it first." : ""}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  );
                })()}
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

      {/* Lock Logs Modal */}
      <AnimatePresence>
        {showLockLogs && selectedRecordForLogs && (
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
            onClick={() => setShowLockLogs(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Lock Event Logs
                </h2>
                <button
                  onClick={() => setShowLockLogs(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Record:</strong> {selectedRecordForLogs.clientName} - Session {selectedRecordForLogs.sessionNumber}
                </p>
              </div>

              {lockLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No lock events found.
                </div>
              ) : (
                <div className="space-y-3">
                  {lockLogs.map((log, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              log.action === "LOCK"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : log.action === "UNLOCK"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.performedBy.userName} ({log.performedBy.userRole})
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.reason}</p>
                      )}
                      {log.lockOwner && log.lockOwner.userName !== log.performedBy.userName && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Lock owner: {log.lockOwner.userName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

