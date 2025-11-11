import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
      const outcome = record.outcome || "No outcome recorded";
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
    <div style={{
      minHeight: "100vh",
       width: "100vw",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "40px 0px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Back Button */}
      <div style={{
        width: "100%",
        maxWidth: "1400px",
        marginBottom: "20px"
      }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "2px solid white",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s",
            backdropFilter: "blur(10px)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "white";
            e.target.style.color = "#667eea";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.color = "white";
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <header style={{
        textAlign: "center",
        marginBottom: "40px",
        color: "white"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          marginBottom: "10px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
        }}>
          📊 Counseling Reports
        </h1>
        <p style={{
          fontSize: "1.1rem",
          opacity: "0.9"
        }}>
          Generate and review comprehensive progress reports
        </p>
      </header>

      {/* Main Container */}
      <div style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Filter Section */}
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          marginBottom: "30px"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <input
              type="text"
              placeholder="🔍 Search by client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{
                padding: "12px 15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "12px 15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: "12px 15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={handleFilter}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "12px 30px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                transition: "transform 0.2s",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              {loading ? "⏳ Loading..." : "📊 Filter Records"}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={filteredRecords.length === 0}
              style={{
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                color: "white",
                padding: "12px 30px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                cursor: filteredRecords.length === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(17, 153, 142, 0.4)",
                transition: "transform 0.2s",
                opacity: filteredRecords.length === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => filteredRecords.length > 0 && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              📥 Download PDF
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: "20px",
              padding: "12px",
              background: "#fee",
              color: "#c33",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "500"
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Records Table */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          overflow: "hidden"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white"
                }}>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Client Name</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Counselor</th>
                  <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#718096",
                      fontStyle: "italic"
                    }}>
                      ⏳ Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={record._id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        background: index % 2 === 0 ? "#296892ff" : "white",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#296892ff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#296892ff" : "white"}
                    >
                      <td style={{ padding: "15px", fontWeight: "500" }}>{record.clientName}</td>
                      <td style={{ padding: "15px" }}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          background: record.status === "Completed" ? "#c6f6d5" : 
                                     record.status === "Ongoing" ? "#bee3f8" : "#fed7d7",
                          color: record.status === "Completed" ? "#22543d" : 
                                 record.status === "Ongoing" ? "#1a365d" : "#742a2a"
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: "15px" }}>{record.counselor}</td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedRecord(record)}
                          style={{
                            background: "#667eea",
                            color: "white",
                            padding: "8px 20px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#5568d3";
                            e.target.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#667eea";
                            e.target.style.transform = "scale(1)";
                          }}
                        >
                          👁️ View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#718096",
                      fontStyle: "italic"
                    }}>
                      📭 No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Detailed Record */}
      {selectedRecord && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#2d3748"
            }}>
              📋 {selectedRecord.clientName} — Session Details
            </h2>
            <p style={{
              color: "#718096",
              marginBottom: "30px",
              fontSize: "1.1rem"
            }}>
              👤 Counselor: <strong>{selectedRecord.counselor}</strong> | 📅 Date: <strong>{new Date(selectedRecord.date).toLocaleDateString()}</strong>
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                background: "#667eea15",
                padding: "20px",
                borderRadius: "12px",
                borderLeft: "4px solid #667eea",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
                <div style={{ fontSize: "0.9rem", color: "#718096", marginBottom: "5px" }}>Status</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#667eea" }}>{selectedRecord.status}</div>
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                marginBottom: "15px",
                color: "#2d3748"
              }}>
                📝 Notes
              </h3>
              <div style={{
                background: "#f7fafc",
                borderRadius: "10px",
                padding: "20px",
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                color: "#4a5568"
              }}>
                {selectedRecord.notes || "No notes available"}
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                marginBottom: "15px",
                color: "#2d3748"
              }}>
                🎯 Outcome
              </h3>
              <div style={{
                background: "#f7fafc",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                color: "#4a5568"
              }}>
                {selectedRecord.outcome || "No outcome recorded"}
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: "#718096",
                  color: "white",
                  padding: "12px 30px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#4a5568"}
                onMouseLeave={(e) => e.target.style.background = "#718096"}
              >
                ✖️ Close
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  color: "white",
                  padding: "12px 30px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 4px 15px rgba(17, 153, 142, 0.4)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
