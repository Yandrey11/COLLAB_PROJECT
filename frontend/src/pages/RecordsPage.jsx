import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/records";

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
      document.head.removeChild(style);
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
  const [driveMessage, setDriveMessage] = useState(null);

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

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        console.warn("No token found");
        setUser(null);
        return;
      }
      
      const res = await axios.get("http://localhost:5000/api/auth/me", {
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
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
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
      alert("⚠️ Please fill out client name and session type.");
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      alert("⚠️ Please log in to create records");
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
        alert("⚠️ Unable to determine counselor name. Please log in again.");
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
      
      alert("✅ New record created and uploaded to Google Drive successfully!");
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
      alert("❌ Failed to create record");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await axios.put(`${API_URL}/${selectedRecord._id}`, selectedRecord, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      alert("✅ Record updated successfully!");
      setSelectedRecord(null);
      fetchRecords();
    } catch (err) {
      console.error("Error updating record:", err);
      alert("❌ Failed to update record");
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch = r.clientName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchType = filterType ? r.sessionType === filterType : true;
    return matchSearch && matchType;
  });

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
              flexDirection: "column",
              gap: 12,
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
            Counseling Records
          </h1>
                <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
                  Manage and track all counseling session records, notes, and outcomes.
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
            }}
          >
              <span style={{ fontSize: 13, color: "#6b7280" }}>Counselor:</span>
            <span
              style={{
                  fontWeight: 600,
                  color: user ? "#4f46e5" : "#ef4444",
                  padding: "6px 12px",
                  backgroundColor: user ? "rgba(79, 70, 229, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 13,
              }}
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
              window.location.href = "http://localhost:5000/auth/drive";
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
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
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
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
            alignItems: "center",
          }}
            className="search-filter-container"
        >
            <input
              type="text"
              placeholder="🔍 Search by client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "1px solid #e6e9ef",
                background: "#fff",
                padding: "10px 12px",
                borderRadius: 10,
                color: "#111827",
                fontSize: 14,
                transition: "all 0.2s",
                boxSizing: "border-box",
                width: "100%",
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                border: "1px solid #e6e9ef",
                background: "#fff",
                padding: "10px 12px",
                borderRadius: 10,
                color: "#111827",
                fontSize: 14,
                transition: "all 0.2s",
                cursor: "pointer",
                minWidth: 150,
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
                                Edit
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
                  {filteredRecords.map((record, index) => (
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
                          marginTop: 12,
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedRecord(record)}
                          style={{
                            width: "100%",
                            background: "#4f46e5",
                            color: "white",
                            padding: "10px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
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
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: 20,
                    color: "#111827",
                  }}
                >
                  Edit Record — {selectedRecord.clientName}
                </h2>

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
                    value={selectedRecord.outcomes || ""}
                    onChange={(e) =>
                      setSelectedRecord({
                        ...selectedRecord,
                        outcomes: e.target.value,
                      })
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
                    onClick={handleSave}
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
                    Save Changes
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecordsPage;
