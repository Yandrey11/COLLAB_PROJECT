import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:5000/api/records";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState("");

  // ✅ Fetch records from backend
  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecords(res.data || []);
      setFilteredRecords(res.data || []);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError(err.response?.data?.message || "Failed to load records");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // ✅ Filter records based on search criteria
  const handleFilter = () => {
    let filtered = [...records];

    if (clientName) {
      filtered = filtered.filter(record => 
        record.clientName?.toLowerCase().includes(clientName.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= new Date(endDate)
      );
    }

    setFilteredRecords(filtered);
  };

  // ✅ Generate Document Tracking Number
  const generateTrackingNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DOC-${timestamp}-${random}`;
  };

  // ✅ Add header and footer to each page
  const addHeaderFooter = (doc, pageNum, totalPages, trackingNumber, reportDate) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(102, 126, 234); // #667eea
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("COUNSELING RECORDS REPORT", pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Document Tracking: ${trackingNumber}`, 14, 22);
    doc.text(`Date: ${reportDate}`, pageWidth - 14, 22, { align: 'right' });

    // Footer with comprehensive information
    doc.setFillColor(102, 126, 234);
    doc.rect(0, pageHeight - 35, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Footer line 1: Confidentiality notice
    doc.text("CONFIDENTIAL - This document contains sensitive information and is protected under client confidentiality agreements.", 
      pageWidth / 2, pageHeight - 28, { align: 'center' });
    
    // Footer line 2: Organization info and page number
    doc.setFontSize(7);
    doc.text("Counseling Services Management System", 14, pageHeight - 18);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text(`Tracking: ${trackingNumber}`, pageWidth - 14, pageHeight - 18, { align: 'right' });
    
    // Footer line 3: Contact and disclaimer
    doc.setFontSize(6);
    doc.text("For inquiries, contact your system administrator. This report is generated electronically.", 
      pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Reset text color for content
    doc.setTextColor(0, 0, 0);
  };

  // ✅ Generate and download PDF
  const handleDownloadPDF = () => {
    const recordsToExport = selectedRecord ? [selectedRecord] : filteredRecords;
    if (recordsToExport.length === 0) return;

    const doc = new jsPDF();
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const reportDateTime = new Date().toLocaleString();

    // Calculate total pages needed (ensure at least 2 pages)
    let estimatedPages = Math.max(2, Math.ceil(recordsToExport.length / 2));
    if (recordsToExport.length === 1) estimatedPages = 2; // Force at least 2 pages for single record

    // Page 1: Cover/Summary Page
    addHeaderFooter(doc, 1, estimatedPages, trackingNumber, reportDate);
    
    let finalY = 50; // Start below header (30px header)
    const maxContentHeight = doc.internal.pageSize.getHeight() - 35 - 50; // Account for footer (35px) and bottom margin

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("COUNSELING RECORDS REPORT", 105, finalY, { align: 'center' });
    finalY += 15;

    // Report Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Generated: ${reportDateTime}`, 105, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, 105, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Total Records: ${recordsToExport.length}`, 105, finalY, { align: 'center' });
    finalY += 20;

    // Summary Statistics
    const completed = recordsToExport.filter(r => r.status === "Completed").length;
    const ongoing = recordsToExport.filter(r => r.status === "Ongoing").length;
    const referred = recordsToExport.filter(r => r.status === "Referred").length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Summary Statistics", 105, finalY, { align: 'center' });
    finalY += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Completed Sessions: ${completed}`, 105, finalY, { align: 'center' });
    finalY += 8;
    doc.text(`Ongoing Sessions: ${ongoing}`, 105, finalY, { align: 'center' });
    finalY += 8;
    doc.text(`Referred Sessions: ${referred}`, 105, finalY, { align: 'center' });
    finalY += 20;

    // Date Range (if applicable)
    if (startDate || endDate) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Date Range:", 105, finalY, { align: 'center' });
      finalY += 8;
      doc.setFont("helvetica", "normal");
      const dateRange = `${startDate || 'N/A'} to ${endDate || 'N/A'}`;
      doc.text(dateRange, 105, finalY, { align: 'center' });
    }

    // Add second page for records
    doc.addPage();
    addHeaderFooter(doc, 2, estimatedPages, trackingNumber, reportDate);
    finalY = 50;

    // Records Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DETAILED RECORDS", 105, finalY, { align: 'center' });
    finalY += 15;

    recordsToExport.forEach((record, idx) => {
      // Check if we need a new page (accounting for footer height)
      if (finalY > maxContentHeight && idx < recordsToExport.length - 1) {
        estimatedPages++;
        doc.addPage();
        addHeaderFooter(doc, doc.internal.getNumberOfPages(), estimatedPages, trackingNumber, reportDate);
        finalY = 50;
      }

      // Record separator
      if (idx > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY - 5, 196, finalY - 5);
        finalY += 5;
      }

      // Record header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Record ${idx + 1}`, 14, finalY);
      finalY += 10;

      // Record details
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const details = [
        { label: "Client Name", value: record.clientName || "N/A" },
        { label: "Date", value: new Date(record.date).toLocaleDateString() },
        { label: "Status", value: record.status || "N/A" },
        { label: "Counselor", value: record.counselor || "N/A" },
      ];

      details.forEach(detail => {
        doc.setFont("helvetica", "bold");
        doc.text(`${detail.label}:`, 14, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(detail.value, 14 + 50, finalY);
        finalY += 7;
      });

      // Notes (with word wrap)
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      finalY += 7;
      doc.setFont("helvetica", "normal");
      const notes = record.notes || "No notes available";
      const splitNotes = doc.splitTextToSize(notes, 180);
      doc.text(splitNotes, 14, finalY);
      finalY += splitNotes.length * 5 + 5;

      // Outcome (with word wrap)
      doc.setFont("helvetica", "bold");
      doc.text("Outcome:", 14, finalY);
      finalY += 7;
      doc.setFont("helvetica", "normal");
      const outcome = record.outcomes || record.outcome || "No outcome recorded";
      const splitOutcome = doc.splitTextToSize(outcome, 180);
      doc.text(splitOutcome, 14, finalY);
      finalY += splitOutcome.length * 5 + 10;
    });

    // If we only have one page of records, add additional content to ensure 2 pages
    if (doc.internal.getNumberOfPages() < 2) {
      doc.addPage();
      addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
      finalY = 50;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("ADDITIONAL INFORMATION", 105, finalY, { align: 'center' });
      finalY += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("This report contains confidential counseling session records.", 105, finalY, { align: 'center' });
      finalY += 10;
      doc.text("All information is protected under client confidentiality agreements.", 105, finalY, { align: 'center' });
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
      doc.text(`Report Type: ${selectedRecord ? 'Single Record' : 'Multiple Records'}`, 14, finalY);
    }

    // Update all page numbers with correct total
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addHeaderFooter(doc, i, totalPages, trackingNumber, reportDate);
    }

    const fileName = selectedRecord
      ? `${selectedRecord.clientName.replace(/\s+/g, '_')}_record_${trackingNumber}.pdf`
      : `counseling-records_${trackingNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(fileName);
  };

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
        boxSizing: "border-box",
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
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ color: "#111827", margin: 0, fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                Counseling Reports
              </h1>
              <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
                Generate and review comprehensive progress reports for counseling sessions.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #e6e9ef",
                background: "#fff",
                cursor: "pointer",
                color: "#111827",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </motion.button>
          </div>
        </motion.div>
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search by client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
          
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFilter}
              disabled={loading}
              style={{
                background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
                color: "white",
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? "⏳ Loading..." : "📊 Filter Records"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadPDF}
              disabled={filteredRecords.length === 0}
              style={{
                background: "linear-gradient(90deg, #10b981, #059669)",
                color: "white",
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                cursor: filteredRecords.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                opacity: filteredRecords.length === 0 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📥 Download PDF
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 20,
                padding: 12,
                background: "#fee",
                color: "#c33",
                borderRadius: 10,
                textAlign: "center",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              ❌ {error}
            </motion.div>
          )}
        </motion.div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "3rem",
                  height: "3rem",
                  border: "4px solid #4f46e5",
                  borderTopColor: "transparent",
                  borderRadius: "9999px",
                  margin: "0 auto",
                }}
              ></motion.div>
              <p style={{ color: "#6b7280", marginTop: "1rem", fontSize: 14 }}>
                Loading records...
              </p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
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
                        textAlign: "center",
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
                    {filteredRecords.map((record, index) => (
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
                        <td style={{ padding: "12px", fontWeight: 500, fontSize: 14 }}>
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
                          {record.counselor}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedRecord(record)}
                              style={{
                                background: "#4f46e5",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              View Details
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  fontStyle: "italic",
                }}
              >
                📭 No records found matching your criteria.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal for Detailed Record */}
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
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: 20,
                  color: "#111827",
                }}
              >
                {selectedRecord.clientName} — Session Details
              </h2>
              <p
                style={{
                  color: "#6b7280",
                  marginBottom: 20,
                  fontSize: 14,
                }}
              >
                Counselor: <strong>{selectedRecord.counselor}</strong> | Date:{" "}
                <strong>
                  {new Date(selectedRecord.date).toLocaleDateString()}
                </strong>
              </p>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    background: "rgba(79, 70, 229, 0.1)",
                    padding: 16,
                    borderRadius: 10,
                    borderLeft: "4px solid #4f46e5",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7280",
                      marginBottom: 5,
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#4f46e5",
                    }}
                  >
                    {selectedRecord.status}
                  </div>
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
                  Notes
                </label>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: 12,
                    border: "1px solid #e6e9ef",
                    color: "#4a5568",
                    fontSize: 14,
                    minHeight: 80,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {selectedRecord.notes || "No notes available"}
                </div>
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
                  Outcome
                </label>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: 12,
                    border: "1px solid #e6e9ef",
                    color: "#4a5568",
                    fontSize: 14,
                    minHeight: 80,
                  }}
                >
                  {selectedRecord.outcomes || selectedRecord.outcome || "No outcome recorded"}
                </div>
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadPDF}
                  style={{
                    background: "linear-gradient(90deg, #10b981, #059669)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  Download PDF
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
