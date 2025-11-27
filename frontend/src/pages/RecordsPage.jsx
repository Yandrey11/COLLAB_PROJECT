import { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { NotificationBadgeBadge } from "../components/NotificationBadge";
import { initializeTheme } from "../utils/themeUtils";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records`;
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to get full image URL from backend
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${path}`;
};

const RecordsPage = () => {
  // Add responsive styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media (min-width: 768px) {
        .desktop-table {
          display: block !important;
        }
        .mobile-cards {
          display: none !important;
        }
      }
      @media (max-width: 767px) {
        .desktop-table {
          display: none !important;
        }
        .mobile-cards {
          display: flex !important;
        }
        .search-filter-container {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      // Safely remove style element if it still exists
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    clientName: "",
    date: "",
    sessionType: "",
    status: "Ongoing",
    notes: "",
    outcomes: "",
    driveLink: "",
  });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driveMessage, setDriveMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Lock management state
  const [lockStatuses, setLockStatuses] = useState({}); // { recordId: { locked, lockedBy, canLock, canUnlock, isLockOwner } }
  const [lockingRecordId, setLockingRecordId] = useState(null);
  const [unlockingRecordId, setUnlockingRecordId] = useState(null);

  const generateTrackingNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `DOC-${timestamp}-${random}`;
  };

  const addHeaderFooter = (doc, pageNum, totalPages, trackingNumber, reportDate) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("COUNSELING RECORDS REPORT", pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Document Tracking: ${trackingNumber}`, 14, 22);
    doc.text(`Date: ${reportDate}`, pageWidth - 14, 22, { align: "right" });

    doc.setFillColor(102, 126, 234);
    doc.rect(0, pageHeight - 35, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "CONFIDENTIAL - This document contains sensitive information and is protected under client confidentiality agreements.",
      pageWidth / 2,
      pageHeight - 28,
      { align: "center" }
    );

    doc.setFontSize(7);
    doc.text("Counseling Services Management System", 14, pageHeight - 18);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: "center" });
    doc.text(`Tracking: ${trackingNumber}`, pageWidth - 14, pageHeight - 18, { align: "right" });

    doc.setFontSize(6);
    doc.text(
      "For inquiries, contact your system administrator. This report is generated electronically.",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    doc.setTextColor(0, 0, 0);
  };

  useEffect(() => {
    initializeTheme(); // Initialize theme on page load
  }, []);

  useEffect(() => {
    // Always fetch fresh user info if we have a token
    const storedToken = localStorage.getItem("token") || localStorage.getItem("authToken");
    
    if (storedToken) {
      // Fetch fresh user info from backend to ensure we have the latest data
      fetchUserInfo();
    } else {
      // No token, check if there's stored user data (fallback)
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Only use stored user if it has name or email
          if (parsedUser.name || parsedUser.email) {
            setUser(parsedUser);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Error parsing user data:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user) return;

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${baseUrl}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setProfile(res.data.profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        console.warn("No token found");
        setUser(null);
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.get(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different response structures
      const userData = res.data.user || res.data;
      
      // Ensure we have name or email before setting user
      if (userData && (userData.name || userData.email)) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Also ensure token is stored consistently
        if (!localStorage.getItem("token") && localStorage.getItem("authToken")) {
          localStorage.setItem("token", localStorage.getItem("authToken"));
        }
        if (!localStorage.getItem("authToken") && localStorage.getItem("token")) {
          localStorage.setItem("authToken", localStorage.getItem("token"));
        }
      } else {
        console.warn("User data incomplete:", userData);
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      // If token is invalid, clear everything
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRecords(res.data || []);
      
      // Fetch lock status for each record
      if (res.data && res.data.length > 0) {
        res.data.forEach((record) => {
          fetchLockStatus(record._id);
        });
      }
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lock status for a record (counselor endpoint)
  const fetchLockStatus = async (recordId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;
      
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

  // Lock a record (counselor can only lock their own records)
  const handleLockRecord = async (record) => {
    try {
      setLockingRecordId(record._id);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.post(`${API_URL}/${record._id}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Lock was successful
      if (response.data.success) {
        await fetchLockStatus(record._id);
        Swal.fire({
          icon: "success",
          title: "Record Locked",
          text: response.data.message || "Record has been locked successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchRecords(); // Refresh to get updated lock info
      } else {
        Swal.fire({
          icon: "error",
          title: "Lock Failed",
          text: response.data.message || "Failed to lock record.",
        });
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

  // Unlock a record (counselor can only unlock their own locks)
  const handleUnlockRecord = async (record) => {
    try {
      setUnlockingRecordId(record._id);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.post(`${API_URL}/${record._id}/unlock`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Unlock was successful
      if (response.data.success) {
        await fetchLockStatus(record._id);
        Swal.fire({
          icon: "success",
          title: "Record Unlocked",
          text: response.data.message || "Record has been unlocked successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchRecords(); // Refresh to get updated lock info
      } else {
        Swal.fire({
          icon: "error",
          title: "Unlock Failed",
          text: response.data.message || "Failed to unlock record.",
        });
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

  useEffect(() => {
    fetchRecords();
    
    // Check for OAuth callback messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") === "drive_connection_failed") {
      setDriveMessage({ type: "error", text: "Failed to connect to Google Drive. Please try again." });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("success") === "drive_connected") {
      setDriveMessage({ type: "success", text: "✅ Google Drive connected successfully! You can now save records with Drive links." });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch lock status when edit modal opens
  useEffect(() => {
    if (selectedRecord) {
      fetchLockStatus(selectedRecord._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecord]);

  // Separate effect to refresh user info if needed
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      // If user is missing or incomplete, fetch from backend
      if (!user || (!user.name && !user.email)) {
        fetchUserInfo();
      }
    }
  }, [user]);
  
  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (driveMessage) {
      const timer = setTimeout(() => setDriveMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [driveMessage]);

  const handleCreateRecord = async () => {
    if (!newRecord.clientName || !newRecord.sessionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill out client name and session type.",
      });
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please log in to create records",
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      
      // Ensure we have fresh user info
      let currentUser = user;
      if (!currentUser || (!currentUser.name && !currentUser.email)) {
        await fetchUserInfo();
        // Get updated user from localStorage after fetch
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            currentUser = JSON.parse(storedUser);
          } catch (e) {
            console.error("Error parsing user:", e);
          }
        }
      }
      
      // Get counselor name - must have name or email
      const counselorName = currentUser?.name || currentUser?.email;
      
      if (!counselorName) {
        Swal.fire({
          icon: "warning",
          title: "Authentication Error",
          text: "Unable to determine counselor name. Please log in again.",
        });
        navigate("/login");
        return;
      }
      
      const recordToSend = {
        ...newRecord,
        counselor: counselorName,
      };

      const res = await axios.post(API_URL, recordToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh records to get the updated record with driveLink
      await fetchRecords();
      
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "New record created and uploaded to Google Drive successfully!",
        timer: 3000,
        showConfirmButton: false,
      });
      setNewRecord({
        clientName: "",
        date: "",
        sessionType: "",
        status: "Ongoing",
        notes: "",
        outcomes: "",
        driveLink: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating record:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create record",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Check lock status before saving
      const lockStatus = await fetchLockStatus(selectedRecord._id);
      
      if (lockStatus.locked && !lockStatus.isLockOwner) {
        Swal.fire({
          icon: "warning",
          title: "Record Locked",
          text: `This record is locked by ${lockStatus.lockedBy?.userName || "another user"}. You cannot edit it.`,
        });
        return;
      }

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await axios.put(`${API_URL}/${selectedRecord._id}`, selectedRecord, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Record updated successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedRecord(null);
      fetchRecords();
    } catch (err) {
      console.error("Error updating record:", err);
      
      // Handle 423 Locked status
      if (err.response?.status === 423) {
        Swal.fire({
          icon: "warning",
          title: "Record Locked",
          text: err.response?.data?.message || "This record is locked by another user. You cannot edit it.",
        });
        await fetchLockStatus(selectedRecord._id);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update record",
        });
      }
    }
  };

  const handleDelete = async (record) => {
    const result = await Swal.fire({
      title: "Delete Record?",
      html: `Are you sure you want to delete the record for <strong>${record.clientName}</strong>?<br/><br/>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        await axios.delete(`${API_URL}/${record._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Record has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        
        fetchRecords();
      } catch (err) {
        console.error("Error deleting record:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to delete record",
        });
      }
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch = r.clientName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchType = filterType ? r.sessionType === filterType : true;
    return matchSearch && matchType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const handleRefresh = () => {
    fetchRecords();
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
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      try {
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
      localStorage.removeItem("token");
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

  const handleDownloadPDF = () => {
    const recordsToExport = selectedRecord ? [selectedRecord] : filteredRecords;
    if (recordsToExport.length === 0) return;

    const doc = new jsPDF();
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const reportDateTime = new Date().toLocaleString();

    let estimatedPages = Math.max(2, Math.ceil(recordsToExport.length / 2));
    if (recordsToExport.length === 1) estimatedPages = 2;

    addHeaderFooter(doc, 1, estimatedPages, trackingNumber, reportDate);
    let finalY = 50;
    const maxContentHeight = doc.internal.pageSize.getHeight() - 35 - 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("COUNSELING RECORDS REPORT", 105, finalY, { align: "center" });
    finalY += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Generated: ${reportDateTime}`, 105, finalY, { align: "center" });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, 105, finalY, { align: "center" });
    finalY += 10;
    doc.text(`Total Records: ${recordsToExport.length}`, 105, finalY, { align: "center" });
    finalY += 20;

    const completed = recordsToExport.filter((r) => r.status === "Completed").length;
    const ongoing = recordsToExport.filter((r) => r.status === "Ongoing").length;
    const referred = recordsToExport.filter((r) => r.status === "Referred").length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Summary Statistics", 105, finalY, { align: "center" });
    finalY += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Completed Sessions: ${completed}`, 105, finalY, { align: "center" });
    finalY += 8;
    doc.text(`Ongoing Sessions: ${ongoing}`, 105, finalY, { align: "center" });
    finalY += 8;
    doc.text(`Referred Sessions: ${referred}`, 105, finalY, { align: "center" });
    finalY += 20;

    doc.addPage();
    addHeaderFooter(doc, 2, estimatedPages, trackingNumber, reportDate);
    finalY = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DETAILED RECORDS", 105, finalY, { align: "center" });
    finalY += 15;

    const pageHeight = doc.internal.pageSize.getHeight();

    recordsToExport.forEach((record, idx) => {
      if (finalY > maxContentHeight && idx < recordsToExport.length - 1) {
        estimatedPages++;
        doc.addPage();
        addHeaderFooter(doc, doc.internal.getNumberOfPages(), estimatedPages, trackingNumber, reportDate);
        finalY = 50;
      }

      if (idx > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY - 5, 196, finalY - 5);
        finalY += 5;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Record ${idx + 1}`, 14, finalY);
      finalY += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const details = [
        { label: "Client Name", value: record.clientName || "N/A" },
        { label: "Date", value: record.date ? new Date(record.date).toLocaleDateString() : "N/A" },
        { label: "Status", value: record.status || "N/A" },
        { label: "Counselor", value: record.counselor || "N/A" },
      ];

      details.forEach((detail) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${detail.label}:`, 14, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(detail.value, 64, finalY);
        finalY += 7;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      finalY += 7;
      doc.setFont("helvetica", "normal");
      const notes = record.notes || "No notes available";
      const splitNotes = doc.splitTextToSize(notes, 180);
      doc.text(splitNotes, 14, finalY);
      finalY += splitNotes.length * 5 + 5;

      doc.setFont("helvetica", "bold");
      doc.text("Outcome:", 14, finalY);
      finalY += 7;
      doc.setFont("helvetica", "normal");
      const outcome = record.outcomes || record.outcome || "No outcome recorded";
      const splitOutcome = doc.splitTextToSize(outcome, 180);
      doc.text(splitOutcome, 14, finalY);
      finalY += splitOutcome.length * 5 + 10;
    });

    if (doc.internal.getNumberOfPages() < 2) {
      doc.addPage();
      addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
      finalY = 50;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("ADDITIONAL INFORMATION", 105, finalY, { align: "center" });
      finalY += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("This report contains confidential counseling session records.", 105, finalY, { align: "center" });
      finalY += 10;
      doc.text("All information is protected under client confidentiality agreements.", 105, finalY, { align: "center" });
      finalY += 15;

      doc.setFont("helvetica", "bold");
      doc.text("Report Metadata:", 14, finalY);
      finalY += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Document ID: ${trackingNumber}`, 14, finalY);
      finalY += 7;
      doc.text(`Generated On: ${reportDateTime}`, 14, finalY);
      finalY += 7;
      doc.text(`Total Records Included: ${recordsToExport.length}`, 14, finalY);
      finalY += 7;
      doc.text(`Report Type: ${selectedRecord ? "Single Record" : "Multiple Records"}`, 14, finalY);
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addHeaderFooter(doc, i, totalPages, trackingNumber, reportDate);
    }

    const fileName = selectedRecord
      ? `${selectedRecord.clientName.replace(/\s+/g, "_")}_record_${trackingNumber}.pdf`
      : `counseling-records_${trackingNumber}_${new Date().toISOString().split("T")[0]}.pdf`;

    doc.save(fileName);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 md:p-8 gap-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left: Overview / Navigation */}
        <aside className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm h-fit lg:sticky lg:top-6">
          {/* Profile Picture and Name */}
          <div className="flex flex-col items-center gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            {profile?.profilePicture ? (
              <img
                src={getImageUrl(profile.profilePicture)}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-indigo-600"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-gray-100 text-base">{user?.name || profile?.name || "Counselor"}</div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 m-0">Guidance Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            The Dashboard provides counselors with an at-a-glance view of personal schedules, sessions,
            meetings, and planned activities for the current day or week.
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:to-white dark:hover:to-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/records")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/30 dark:to-gray-800 hover:from-white hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-indigo-900/30 text-white font-semibold text-left transition-all"
              style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#fff" }}
            >
              Records Page
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:to-white dark:hover:to-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
            >
              Reports Page
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:from-indigo-50 hover:to-white dark:hover:from-gray-700 dark:hover:to-gray-800 hover:shadow-sm text-gray-900 dark:text-gray-100 font-semibold text-left transition-all relative"
            >
              <span>Notification Center</span>
              <span className="absolute top-1 right-1">
                <NotificationBadgeBadge />
              </span>
            </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="p-3 rounded-xl border border-indigo-50 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 hover:to-white dark:hover:to-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-left transition-all"
                >
                  User Profile & Settings
                </button>

                <div className="flex gap-2 mt-4">
              <button
                onClick={handleRefresh}
                className="flex-1 p-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Data Synchronization:
              <div className="mt-1">
                The dashboard listens for changes to stored user data and will update automatically across
                browser contexts. For backend-driven real-time updates, server-side events or websockets
                would be used (not modified here).
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Main content */}
        <main className="w-full">
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-gray-900 dark:text-gray-100 m-0 text-2xl md:text-3xl lg:text-4xl">
                Counseling Records
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1.5 text-sm">
                Manage and track all counseling session records, notes, and outcomes.
              </p>
            </div>
          <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Counselor:</span>
            <span
              className={`font-semibold px-3 py-1.5 rounded-lg text-sm ${
                user 
                  ? "text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30" 
                  : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {user?.name || user?.email || "Not logged in"}
            </span>
            </div>
          </div>
        </motion.div>

        {/* Drive Connection Message */}
        <AnimatePresence>
          {driveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: driveMessage.type === "success" 
                  ? "linear-gradient(90deg, #10b981, #059669)" 
                  : "linear-gradient(90deg, #ef4444, #dc2626)",
                color: "white",
                padding: "12px 20px",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {driveMessage.text}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDriveMessage(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
              color: "white",
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
            }}
          >
            <span style={{ fontSize: "18px" }}>
              {showForm ? "−" : "+"}
            </span>
            {showForm ? "Close Form" : "Create New Record"}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
              window.location.href = `${baseUrl}/auth/drive`;
            }}
            style={{
              background: "linear-gradient(90deg, #10b981, #059669)",
              color: "white",
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            <span style={{ fontSize: "18px" }}>☁️</span>
            Connect Google Drive
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            style={{
              background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
              color: "white",
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            }}
          >
            📄 Download Report PDF
          </motion.button>
        </motion.div>

        {/* New Record Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-gray-100">
                  Create New Record
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 6,
                        color: "#374151",
                      }}
                    >
                      Client Name *
                    </label>
                    <input
                    type="text"
                      placeholder="Enter client name"
                    value={newRecord.clientName}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        clientName: e.target.value,
                      })
                    }
                    style={{
                        width: "100%",
                        border: "1px solid #e6e9ef",
                        background: "#fff",
                        padding: "10px 12px",
                        borderRadius: 10,
                        color: "#111827",
                        fontSize: 14,
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                        e.currentTarget.style.borderColor = "#e6e9ef";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 6,
                        color: "#374151",
                      }}
                    >
                      Date
                    </label>
                    <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, date: e.target.value })
                    }
                    style={{
                        width: "100%",
                        border: "1px solid #e6e9ef",
                        background: "#fff",
                        padding: "10px 12px",
                        borderRadius: 10,
                        color: "#111827",
                        fontSize: 14,
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                        e.currentTarget.style.borderColor = "#e6e9ef";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 6,
                        color: "#374151",
                      }}
                    >
                      Session Type *
                    </label>
                    <select
                    value={newRecord.sessionType}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        sessionType: e.target.value,
                      })
                    }
                    style={{
                        width: "100%",
                        border: "1px solid #e6e9ef",
                        background: "#fff",
                        padding: "10px 12px",
                        borderRadius: 10,
                        color: "#111827",
                        fontSize: 14,
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                        cursor: "pointer",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                        e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  >
                    <option value="">Select Session Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Group">Group</option>
                    <option value="Career">Career</option>
                    <option value="Academic">Academic</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 6,
                        color: "#374151",
                      }}
                    >
                      Status
                    </label>
                    <select
                    value={newRecord.status}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, status: e.target.value })
                    }
                    style={{
                        width: "100%",
                        border: "1px solid #e6e9ef",
                        background: "#fff",
                        padding: "10px 12px",
                        borderRadius: 10,
                        color: "#111827",
                        fontSize: 14,
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                        cursor: "pointer",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                        e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Referred">Referred</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Session Notes
                  </label>
                  <textarea
                    placeholder="Enter session notes..."
                  value={newRecord.notes}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, notes: e.target.value })
                  }
                  rows="3"
                  style={{
                    width: "100%",
                      border: "1px solid #e6e9ef",
                      background: "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid #4f46e5";
                      e.currentTarget.style.outlineOffset = "2px";
                      e.currentTarget.style.borderColor = "#4f46e5";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Outcomes
                  </label>
                  <textarea
                    placeholder="Enter outcomes..."
                  value={newRecord.outcomes}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, outcomes: e.target.value })
                  }
                  rows="3"
                  style={{
                    width: "100%",
                      border: "1px solid #e6e9ef",
                      background: "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid #4f46e5";
                      e.currentTarget.style.outlineOffset = "2px";
                      e.currentTarget.style.borderColor = "#4f46e5";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                  }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "1px solid #e6e9ef",
                      background: "#fff",
                      cursor: "pointer",
                      color: "#111827",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateRecord}
                    style={{
                      background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
                      color: "white",
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                      boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                    }}
                  >
                    Save Record
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center search-filter-container">
            <input
              type="text"
              placeholder="🔍 Search by client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer min-w-[150px]"
            >
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
              <option value="Career">Career</option>
              <option value="Academic">Academic</option>
            </select>
          </div>
        </motion.div>

        {/* Records Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
        >
          {loading ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full mx-auto"
              ></motion.div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                Loading records...
              </p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div
                style={{
                  display: "none",
                  overflowX: "auto",
                }}
                className="desktop-table"
              >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                    color: "#111827",
                  }}
                >
                  <thead
                    style={{
                      background: "#f8fafc",
                      borderBottom: "2px solid #e6e9ef",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Session #
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Client Name
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Session Type
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Counselor
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Drive Link
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Lock Status
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedRecords.map((record, index) => (
                        <motion.tr
                          key={record._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          style={{
                            borderBottom: "1px solid #e6e9ef",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 600,
                              fontSize: 14,
                              color: "#4f46e5",
                            }}
                          >
                            #{record.sessionNumber || 1}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 500,
                              fontSize: 14,
                            }}
                          >
                            {record.clientName}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {record.date
                              ? new Date(record.date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                background: "rgba(79, 70, 229, 0.1)",
                                color: "#4f46e5",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              {record.sessionType}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                display: "inline-block",
                                ...(record.status === "Completed"
                                  ? {
                                      background: "rgba(16, 185, 129, 0.1)",
                                      color: "#059669",
                                    }
                                  : record.status === "Ongoing"
                                  ? {
                                      background: "rgba(245, 158, 11, 0.1)",
                                      color: "#d97706",
                                    }
                                  : {
                                      background: "rgba(168, 85, 247, 0.1)",
                                      color: "#9333ea",
                                    }),
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {record.counselor && record.counselor !== "Unknown User" && record.counselor !== "Unknown Counselor"
                              ? record.counselor
                              : user?.name || user?.email || record.counselor || "—"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {(() => {
                              const lockStatus = lockStatuses[record._id];
                              if (!lockStatus) {
                                return (
                                  <span style={{
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: "#f3f4f6",
                                    color: "#6b7280",
                                  }}>
                                    Loading...
                                  </span>
                                );
                              }
                              if (lockStatus.locked) {
                                const isOwner = lockStatus.isLockOwner;
                                return (
                                  <span style={{
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: isOwner
                                      ? "rgba(16, 185, 129, 0.1)"
                                      : "rgba(239, 68, 68, 0.1)",
                                    color: isOwner
                                      ? "#059669"
                                      : "#dc2626",
                                  }}>
                                    🔒 {lockStatus.lockedBy?.userRole === "admin" ? "Admin" : lockStatus.lockedBy?.userName || "Locked"}
                                  </span>
                                );
                              }
                              return (
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  background: "rgba(16, 185, 129, 0.1)",
                                  color: "#059669",
                                }}>
                                  🔓 Unlocked
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {record.driveLink ? (
                              <a
                                href={record.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#4f46e5",
                                  textDecoration: "none",
                                  fontSize: 14,
                                  fontWeight: 500,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecoration =
                                    "underline";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecoration = "none";
                                }}
                              >
                                View File
                              </a>
                            ) : (
                              <span
                                style={{
                                  color: "#9ca3af",
                                  fontSize: 14,
                                  fontStyle: "italic",
                                }}
                              >
                                No file
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 8,
                              }}
                            >
                              {(() => {
                                const lockStatus = lockStatuses[record._id];
                                const isLocked = lockStatus?.locked;
                                const isLockOwner = lockStatus?.isLockOwner;
                                const canEdit = !isLocked || isLockOwner;
                                
                                return (
                                  <>
                                    <motion.button
                                      whileHover={{ scale: canEdit ? 1.05 : 1 }}
                                      whileTap={{ scale: canEdit ? 0.95 : 1 }}
                                      onClick={async () => {
                                        // Check lock status before opening edit modal
                                        const currentLockStatus = await fetchLockStatus(record._id);
                                        if (currentLockStatus.locked && !currentLockStatus.isLockOwner) {
                                          Swal.fire({
                                            icon: "warning",
                                            title: "Record Locked",
                                            text: `This record is locked by ${currentLockStatus.lockedBy?.userName || "another user"}. You cannot edit it.`,
                                          });
                                          return;
                                        }
                                        setSelectedRecord(record);
                                      }}
                                      disabled={!canEdit}
                                      style={{
                                        background: canEdit ? "#4f46e5" : "#9ca3af",
                                        color: "white",
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: canEdit ? "pointer" : "not-allowed",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        opacity: canEdit ? 1 : 0.6,
                                      }}
                                      title={!canEdit ? "Record is locked. Please unlock it first." : "Edit record"}
                                    >
                                      Edit
                                    </motion.button>
                                    {!isLocked || isLockOwner ? (
                                      !isLocked ? (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleLockRecord(record)}
                                          disabled={lockingRecordId === record._id}
                                          style={{
                                            background: lockingRecordId === record._id ? "#9ca3af" : "#10b981",
                                            color: "white",
                                            padding: "6px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: lockingRecordId === record._id ? "not-allowed" : "pointer",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            opacity: lockingRecordId === record._id ? 0.6 : 1,
                                          }}
                                        >
                                          {lockingRecordId === record._id ? "Locking..." : "🔒 Lock"}
                                        </motion.button>
                                      ) : (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleUnlockRecord(record)}
                                          disabled={unlockingRecordId === record._id}
                                          style={{
                                            background: unlockingRecordId === record._id ? "#9ca3af" : "#f59e0b",
                                            color: "white",
                                            padding: "6px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: unlockingRecordId === record._id ? "not-allowed" : "pointer",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            opacity: unlockingRecordId === record._id ? 0.6 : 1,
                                          }}
                                        >
                                          {unlockingRecordId === record._id ? "Unlocking..." : "🔓 Unlock"}
                                        </motion.button>
                                      )
                                    ) : null}
                                  </>
                                );
                              })()}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(record)}
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Delete
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
                className="mobile-cards"
              >
                <AnimatePresence>
                  {paginatedRecords.map((record, index) => (
                    <motion.div
                      key={record._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      style={{
                        background: "#fff",
                        border: "1px solid #e6e9ef",
                        borderRadius: 12,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: 16,
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {record.clientName}
                            </h3>
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "rgba(79, 70, 229, 0.1)",
                                color: "#4f46e5",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Session #{record.sessionNumber || 1}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "#6b7280",
                            }}
                          >
                            {record.date
                              ? new Date(record.date).toLocaleDateString()
                              : "No date"}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              background: "rgba(79, 70, 229, 0.1)",
                              color: "#4f46e5",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {record.sessionType}
                          </span>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                              ...(record.status === "Completed"
                                ? {
                                    background: "rgba(16, 185, 129, 0.1)",
                                    color: "#059669",
                                  }
                                : record.status === "Ongoing"
                                ? {
                                    background: "rgba(245, 158, 11, 0.1)",
                                    color: "#d97706",
                                  }
                                : {
                                    background: "rgba(168, 85, 247, 0.1)",
                                    color: "#9333ea",
                                  }),
                            }}
                          >
                            {record.status}
                          </span>
                          {(() => {
                            const lockStatus = lockStatuses[record._id];
                            if (lockStatus?.locked) {
                              const isOwner = lockStatus.isLockOwner;
                              return (
                                <span style={{
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: isOwner
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : "rgba(239, 68, 68, 0.1)",
                                  color: isOwner
                                    ? "#059669"
                                    : "#dc2626",
                                }}>
                                  🔒 {lockStatus.lockedBy?.userRole === "admin" ? "Locked by Admin" : `Locked by ${lockStatus.lockedBy?.userName || "User"}`}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 12,
                        }}
                      >
                        <strong>Counselor:</strong>{" "}
                        {record.counselor && record.counselor !== "Unknown User" && record.counselor !== "Unknown Counselor"
                          ? record.counselor
                          : user?.name || user?.email || record.counselor || "—"}
                      </div>
                      {record.driveLink && (
                        <div style={{ marginBottom: 12 }}>
                          <a
                            href={record.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4f46e5",
                              textDecoration: "none",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            📎 View Drive File
                          </a>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 12,
                        }}
                      >
                        {(() => {
                          const lockStatus = lockStatuses[record._id];
                          const isLocked = lockStatus?.locked;
                          const isLockOwner = lockStatus?.isLockOwner;
                          const canEdit = !isLocked || isLockOwner;
                          
                          return (
                            <motion.button
                              whileHover={{ scale: canEdit ? 1.02 : 1 }}
                              whileTap={{ scale: canEdit ? 0.98 : 1 }}
                              onClick={async () => {
                                // Check lock status before opening edit modal
                                const currentLockStatus = await fetchLockStatus(record._id);
                                if (currentLockStatus.locked && !currentLockStatus.isLockOwner) {
                                  Swal.fire({
                                    icon: "warning",
                                    title: "Record Locked",
                                    text: `This record is locked by ${currentLockStatus.lockedBy?.userName || "another user"}. You cannot edit it.`,
                                  });
                                  return;
                                }
                                setSelectedRecord(record);
                              }}
                              disabled={!canEdit}
                              style={{
                                flex: 1,
                                background: canEdit ? "#4f46e5" : "#9ca3af",
                                color: "white",
                                padding: "10px",
                                borderRadius: 8,
                                border: "none",
                                cursor: canEdit ? "pointer" : "not-allowed",
                                fontSize: 13,
                                fontWeight: 600,
                                opacity: canEdit ? 1 : 0.6,
                              }}
                              title={!canEdit ? "Record is locked. Please unlock it first." : "Edit record"}
                            >
                              Edit
                            </motion.button>
                          );
                        })()}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDelete(record)}
                          style={{
                            flex: 1,
                            background: "#ef4444",
                            color: "white",
                            padding: "10px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination Controls */}
              {filteredRecords.length > itemsPerPage && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 24,
                    padding: "16px 0",
                    borderTop: "1px solid #e6e9ef",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: "#6b7280",
                    }}
                  >
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #e6e9ef",
                        background: currentPage === 1 ? "#f3f4f6" : "#fff",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        color: currentPage === 1 ? "#9ca3af" : "#111827",
                        fontWeight: 600,
                        fontSize: 13,
                        transition: "all 0.2s",
                        opacity: currentPage === 1 ? 0.5 : 1,
                      }}
                    >
                      Previous
                    </motion.button>
                    
                    {/* Page Numbers */}
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        
                        if (totalPages <= maxVisible) {
                          // Show all pages if 5 or fewer
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);
                          
                          if (currentPage <= 3) {
                            // Near the start
                            for (let i = 2; i <= 4; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            // Near the end
                            pages.push('ellipsis-start');
                            for (let i = totalPages - 3; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // In the middle
                            pages.push('ellipsis-start');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          }
                        }
                        
                        return pages.map((page, idx) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                style={{
                                  padding: "8px 4px",
                                  color: "#6b7280",
                                  fontSize: 13,
                                  userSelect: "none",
                                }}
                              >
                                ...
                              </span>
                            );
                          }
                          
                          return (
                            <motion.button
                              key={page}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: page === currentPage ? "none" : "1px solid #e6e9ef",
                                background: page === currentPage
                                  ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                                  : "#fff",
                                cursor: "pointer",
                                color: page === currentPage ? "#fff" : "#111827",
                                fontWeight: page === currentPage ? 700 : 600,
                                fontSize: 13,
                                minWidth: 36,
                                transition: "all 0.2s",
                              }}
                            >
                              {page}
                            </motion.button>
                          );
                        });
                      })()}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #e6e9ef",
                        background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        color: currentPage === totalPages ? "#9ca3af" : "#111827",
                        fontWeight: 600,
                        fontSize: 13,
                        transition: "all 0.2s",
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  fontStyle: "italic",
                }}
              >
                No records found matching your criteria.
              </p>
            </div>
          )}
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                padding: "16px",
              }}
              onClick={() => setSelectedRecord(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  width: "100%",
                  maxWidth: "500px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        margin: 0,
                        color: "#111827",
                      }}
                    >
                      Edit Record — {selectedRecord.clientName}
                    </h2>
                    {(() => {
                      const lockStatus = lockStatuses[selectedRecord?._id];
                      if (lockStatus?.locked) {
                        const isOwner = lockStatus.isLockOwner;
                        return (
                          <div style={{ marginTop: 8 }}>
                            {isOwner ? (
                              <span style={{
                                padding: "4px 12px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "#059669",
                              }}>
                                🔒 You have locked this record
                              </span>
                            ) : (
                              <span style={{
                                padding: "4px 12px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#dc2626",
                              }}>
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
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 24,
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
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: "#374151",
                          }}
                        >
                          Session Type
                        </label>
                        <input
                          type="text"
                          value={selectedRecord.sessionType || ""}
                          onChange={(e) =>
                            setSelectedRecord({
                              ...selectedRecord,
                              sessionType: e.target.value,
                            })
                          }
                          disabled={isReadOnly}
                    style={{
                      width: "100%",
                      border: "1px solid #e6e9ef",
                      background: isReadOnly ? "#f3f4f6" : "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: isReadOnly ? "#9ca3af" : "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      cursor: isReadOnly ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => {
                      if (!isReadOnly) {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={selectedRecord.status}
                    onChange={(e) =>
                      setSelectedRecord({
                        ...selectedRecord,
                        status: e.target.value,
                      })
                    }
                    disabled={isReadOnly}
                    style={{
                      width: "100%",
                      border: "1px solid #e6e9ef",
                      background: isReadOnly ? "#f3f4f6" : "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: isReadOnly ? "#9ca3af" : "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      cursor: isReadOnly ? "not-allowed" : "pointer",
                    }}
                    onFocus={(e) => {
                      if (!isReadOnly) {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Referred">Referred</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={selectedRecord.notes || ""}
                    onChange={(e) =>
                      setSelectedRecord({
                        ...selectedRecord,
                        notes: e.target.value,
                      })
                    }
                    disabled={isReadOnly}
                    rows="3"
                    style={{
                      width: "100%",
                      border: "1px solid #e6e9ef",
                      background: isReadOnly ? "#f3f4f6" : "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: isReadOnly ? "#9ca3af" : "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      resize: isReadOnly ? "none" : "vertical",
                      fontFamily: "inherit",
                      cursor: isReadOnly ? "not-allowed" : "text",
                    }}
                    placeholder={isReadOnly ? "Record is locked. Please unlock it first." : ""}
                    onFocus={(e) => {
                      if (!isReadOnly) {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Outcomes
                  </label>
                  <textarea
                    value={selectedRecord.outcomes || ""}
                    onChange={(e) =>
                      setSelectedRecord({
                        ...selectedRecord,
                        outcomes: e.target.value,
                      })
                    }
                    disabled={isReadOnly}
                    rows="3"
                    style={{
                      width: "100%",
                      border: "1px solid #e6e9ef",
                      background: isReadOnly ? "#f3f4f6" : "#fff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: isReadOnly ? "#9ca3af" : "#111827",
                      fontSize: 14,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      resize: isReadOnly ? "none" : "vertical",
                      fontFamily: "inherit",
                      cursor: isReadOnly ? "not-allowed" : "text",
                    }}
                    placeholder={isReadOnly ? "Record is locked. Please unlock it first." : ""}
                    onFocus={(e) => {
                      if (!isReadOnly) {
                        e.currentTarget.style.outline = "2px solid #4f46e5";
                        e.currentTarget.style.outlineOffset = "2px";
                        e.currentTarget.style.borderColor = "#4f46e5";
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#e6e9ef";
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(selectedRecord)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: "#ef4444",
                      cursor: "pointer",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    Delete Record
                  </motion.button>
                  <div style={{ display: "flex", gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRecord(null)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "1px solid #e6e9ef",
                        background: "#fff",
                        cursor: "pointer",
                        color: "#111827",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: isReadOnly ? 1 : 1.02 }}
                      whileTap={{ scale: isReadOnly ? 1 : 0.98 }}
                      onClick={handleSave}
                      disabled={isReadOnly}
                      style={{
                        background: isReadOnly 
                          ? "#cbd5e0" 
                          : "linear-gradient(90deg, #06b6d4, #3b82f6)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "none",
                        cursor: isReadOnly ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                        boxShadow: isReadOnly 
                          ? "none" 
                          : "0 4px 12px rgba(6, 182, 212, 0.3)",
                        opacity: isReadOnly ? 0.6 : 1,
                      }}
                      title={isReadOnly ? "Record is locked. Please unlock it first." : ""}
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecordsPage;
