import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/records";

const RecordsPage = () => {
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
  const [driveUploading, setDriveUploading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to get user from different possible storage keys
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    } else if (storedToken) {
      // If only token exists, fetch user info from backend
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.error("Error fetching user info:", err);
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
  }, []);

  const handleCreateRecord = async () => {
    if (!newRecord.clientName || !newRecord.sessionType) {
      alert("⚠️ Please fill out client name and session type.");
      return;
    }

    try {
      const recordToSend = {
        ...newRecord,
        counselor: user?.name || user?.email || "Unknown Counselor",
      };

      const res = await axios.post(API_URL, recordToSend);
      alert("✅ New record created successfully!");
      setNewRecord({
        clientName: "",
        date: "",
        sessionType: "",
        status: "Ongoing",
        notes: "",
        outcomes: "",
        driveLink: "",
      });
      setRecords([...records, res.data]);
      setShowForm(false);
    } catch (err) {
      console.error("Error creating record:", err);
      alert("❌ Failed to create record");
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/${selectedRecord._id}`, selectedRecord);
      alert("✅ Record updated successfully!");
      setSelectedRecord(null);
      fetchRecords();
    } catch (err) {
      console.error("Error updating record:", err);
      alert("❌ Failed to update record");
    }
  };

  const handleUploadToDrive = async (recordId) => {
    try {
      setDriveUploading(recordId);
      const res = await axios.post(
        `http://localhost:5000/api/records/${recordId}/upload-drive`
      );
      alert(`✅ Uploaded successfully!\nGoogle Drive link: ${res.data.driveLink}`);
      fetchRecords();
    } catch (err) {
      console.error("Upload error:", err);
      const message = err.response?.data?.error || err.message;
      if (message.includes("Google Drive not connected")) {
        if (window.confirm("Google Drive not connected. Connect now?")) {
          window.open("http://localhost:5000/auth/drive", "_blank");
        }
      }
    } finally {
      setDriveUploading(null);
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
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
        background: "linear-gradient(to bottom right, #1a1a2e, #16213e, #0f3460)",
        color: "white",
      }}
    >
      <div
        style={{
          padding: "1.5rem",
          maxWidth: "80rem",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/dashboard")}
          style={{
            background: "rgba(55, 65, 81, 0.5)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #4b5563",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(75, 85, 99, 0.5)";
            e.currentTarget.style.borderColor = "#60a5fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(55, 65, 81, 0.5)";
            e.currentTarget.style.borderColor = "#4b5563";
          }}
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            style={{
              fontSize: "2.35rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
              background:
                "linear-gradient(to right, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Counseling Records
          </h1>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>Counselor:</span>
            <span
              style={{
                fontWeight: "600",
                color: "#60a5fa",
                padding: "0.25rem 0.75rem",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "9999px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              {user?.name || user?.email || "Not logged in"}
            </span>
          </div>
        </motion.div>

        {/* Create New Record Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: "2rem" }}
        >
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(to right, #2563eb, #9333ea)",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(to right, #1d4ed8, #7e22ce)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(to right, #2563eb, #9333ea)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>
              {showForm ? "−" : "+"}
            </span>
            {showForm ? "Close Form" : "Create New Record"}
          </button>
        </motion.div>

        {/* New Record Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden", marginBottom: "2rem" }}
            >
              <div
                style={{
                  border: "1px solid #374151",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  background:
                    "linear-gradient(to bottom right, #1f2937, #111827)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "1.25rem",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      width: "0.25rem",
                      height: "1.5rem",
                      background: "#3b82f6",
                      borderRadius: "0.125rem",
                    }}
                  ></span>
                  Create New Record
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    placeholder="Client Name"
                    value={newRecord.clientName}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        clientName: e.target.value,
                      })
                    }
                    style={{
                      border: "1px solid #4b5563",
                      background: "rgba(55, 65, 81, 0.5)",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      color: "white",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        "2px solid #3b82f6";
                      e.currentTarget.style.borderColor =
                        "transparent";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#4b5563";
                    }}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="date"
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, date: e.target.value })
                    }
                    style={{
                      border: "1px solid #4b5563",
                      background: "rgba(55, 65, 81, 0.5)",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      color: "white",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        "2px solid #3b82f6";
                      e.currentTarget.style.borderColor =
                        "transparent";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#4b5563";
                    }}
                  />
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={newRecord.sessionType}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        sessionType: e.target.value,
                      })
                    }
                    style={{
                      border: "1px solid #4b5563",
                      background: "rgba(55, 65, 81, 0.5)",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      color: "white",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        "2px solid #3b82f6";
                      e.currentTarget.style.borderColor =
                        "transparent";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#4b5563";
                    }}
                  >
                    <option value="">Select Session Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Group">Group</option>
                    <option value="Career">Career</option>
                    <option value="Academic">Academic</option>
                  </motion.select>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={newRecord.status}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, status: e.target.value })
                    }
                    style={{
                      border: "1px solid #4b5563",
                      background: "rgba(55, 65, 81, 0.5)",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      color: "white",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline =
                        "2px solid #3b82f6";
                      e.currentTarget.style.borderColor =
                        "transparent";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.borderColor = "#4b5563";
                    }}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Referred">Referred</option>
                  </motion.select>
                </div>

                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  placeholder="Session Notes"
                  value={newRecord.notes}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, notes: e.target.value })
                  }
                  rows="3"
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    width: "100%",
                    marginTop: "1rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                ></motion.textarea>

                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  placeholder="Outcomes"
                  value={newRecord.outcomes}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, outcomes: e.target.value })
                  }
                  rows="3"
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    width: "100%",
                    marginTop: "1rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                ></motion.textarea>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "1.25rem",
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateRecord}
                    style={{
                      background:
                        "linear-gradient(to right, #2563eb, #9333ea)",
                      color: "white",
                      padding: "0.5rem 1.5rem",
                      borderRadius: "0.5rem",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      border: "none",
                      cursor: "pointer",
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              placeholder="🔍 Search by client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "1px solid #4b5563",
                background: "rgba(31, 41, 55, 0.5)",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                color: "white",
                flex: "1",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #3b82f6";
                e.currentTarget.style.borderColor = "transparent";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
                e.currentTarget.style.borderColor = "#4b5563";
              }}
            />
            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                border: "1px solid #4b5563",
                background: "rgba(31, 41, 55, 0.5)",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                color: "white",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #3b82f6";
                e.currentTarget.style.borderColor = "transparent";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
                e.currentTarget.style.borderColor = "#4b5563";
              }}
            >
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
              <option value="Career">Career</option>
              <option value="Academic">Academic</option>
            </motion.select>
          </div>
        </motion.div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            overflowX: "auto",
            border: "1px solid #374151",
            borderRadius: "0.75rem",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            background: "rgba(31, 41, 55, 0.5)",
            backdropFilter: "blur(4px)",
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
                  border: "4px solid #3b82f6",
                  borderTopColor: "transparent",
                  borderRadius: "9999px",
                  margin: "0 auto",
                }}
              ></motion.div>
              <p style={{ color: "#9ca3af", marginTop: "1rem" }}>
                Loading records...
              </p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#d1d5db",
                tableLayout: "auto",
                wordBreak: "break-word",
              }}
            >
              <thead
                style={{
                  background:
                    "linear-gradient(to right, #374151, #1f2937)",
                  color: "#f3f4f6",
                  borderBottom: "1px solid #4b5563",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Client Name
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Session Type
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Counselor
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Drive Link
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontWeight: "600",
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        borderBottom:
                          "1px solid rgba(55, 65, 81, 0.5)",
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(55, 65, 81, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontWeight: "500",
                          wordBreak: "break-word",
                        }}
                      >
                        {record.clientName}
                      </td>
                      <td style={{ padding: "1rem", wordBreak: "break-word" }}>
                        {record.date
                          ? new Date(record.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={{ padding: "1rem", wordBreak: "break-word" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "rgba(59, 130, 246, 0.2)",
                            color: "#60a5fa",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          {record.sessionType}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", wordBreak: "break-word" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            border: "1px solid",
                            ...(record.status === "Completed"
                              ? {
                                  background:
                                    "rgba(34, 197, 94, 0.2)",
                                  color: "#4ade80",
                                  borderColor:
                                    "rgba(34, 197, 94, 0.3)",
                                }
                              : record.status === "Ongoing"
                              ? {
                                  background:
                                    "rgba(234, 179, 8, 0.2)",
                                  color: "#facc15",
                                  borderColor:
                                    "rgba(234, 179, 8, 0.3)",
                                }
                              : {
                                  background:
                                    "rgba(168, 85, 247, 0.2)",
                                  color: "#c084fc",
                                  borderColor:
                                    "rgba(168, 85, 247, 0.3)",
                                }),
                          }}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", wordBreak: "break-word" }}>
                        {record.counselor}
                      </td>
                      <td style={{ padding: "1rem", wordBreak: "break-word" }}>
                        {record.driveLink ? (
                          <a
                            href={record.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#60a5fa",
                              textDecoration: "none",
                              transition: "color 0.3s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#93c5fd";
                              e.currentTarget.style.textDecoration =
                                "underline";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#60a5fa";
                              e.currentTarget.style.textDecoration = "none";
                            }}
                          >
                            View File
                          </a>
                        ) : (
                          <span
                            style={{
                              color: "#6b7280",
                              fontStyle: "italic",
                              wordBreak: "break-word",
                            }}
                          >
                            No file
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedRecord(record)}
                            style={{
                              background: "#2563eb",
                              color: "white",
                              padding: "0.5rem 1rem",
                              borderRadius: "0.5rem",
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#1d4ed8")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#2563eb")
                            }
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUploadToDrive(record._id)}
                            disabled={driveUploading === record._id}
                            style={{
                              background: "#16a34a",
                              color: "white",
                              padding: "0.5rem 1rem",
                              borderRadius: "0.5rem",
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              border: "none",
                              cursor:
                                driveUploading === record._id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: driveUploading === record._id ? 0.5 : 1,
                              transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) =>
                              !e.currentTarget.disabled &&
                              (e.currentTarget.style.background = "#15803d")
                            }
                            onMouseLeave={(e) =>
                              !e.currentTarget.disabled &&
                              (e.currentTarget.style.background = "#16a34a")
                            }
                          >
                            {driveUploading === record._id ? (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  style={{
                                    display: "inline-block",
                                    width: "1rem",
                                    height: "1rem",
                                    border: "2px solid white",
                                    borderTopColor: "transparent",
                                    borderRadius: "9999px",
                                  }}
                                ></motion.span>
                                Uploading...
                              </span>
                            ) : (
                              "Upload"
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "1.125rem",
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
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                padding: "1rem",
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
                  background:
                    "linear-gradient(to bottom right, #1f2937, #111827)",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  width: "100%",
                  maxWidth: "32rem",
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  border: "1px solid #374151",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "1.25rem",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      width: "0.25rem",
                      height: "1.5rem",
                      background: "#3b82f6",
                      borderRadius: "0.125rem",
                    }}
                  ></span>
                  Edit Record — {selectedRecord.clientName}
                </h2>

                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#d1d5db",
                  }}
                >
                  Session Type
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={selectedRecord.sessionType || ""}
                  onChange={(e) =>
                    setSelectedRecord({
                      ...selectedRecord,
                      sessionType: e.target.value,
                    })
                  }
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    width: "100%",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                />

                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#d1d5db",
                  }}
                >
                  Status
                </label>
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={selectedRecord.status}
                  onChange={(e) =>
                    setSelectedRecord({
                      ...selectedRecord,
                      status: e.target.value,
                    })
                  }
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    width: "100%",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Referred">Referred</option>
                </motion.select>

                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#d1d5db",
                  }}
                >
                  Notes
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  value={selectedRecord.notes || ""}
                  onChange={(e) =>
                    setSelectedRecord({
                      ...selectedRecord,
                      notes: e.target.value,
                    })
                  }
                  rows="3"
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    width: "100%",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                ></motion.textarea>

                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#d1d5db",
                  }}
                >
                  Outcomes
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  value={selectedRecord.outcomes || ""}
                  onChange={(e) =>
                    setSelectedRecord({
                      ...selectedRecord,
                      outcomes: e.target.value,
                    })
                  }
                  rows="3"
                  style={{
                    border: "1px solid #4b5563",
                    background: "rgba(55, 65, 81, 0.5)",
                    padding: "0.75rem",
                    width: "100%",
                    borderRadius: "0.5rem",
                    marginBottom: "1.25rem",
                    color: "white",
                    transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid #3b82f6";
                    e.currentTarget.style.borderColor =
                      "transparent";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                ></motion.textarea>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      background: "#4b5563",
                      color: "white",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#374151")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#4b5563")
                    }
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    style={{
                      background:
                        "linear-gradient(to right, #2563eb, #9333ea)",
                      color: "white",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "0.5rem",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      border: "none",
                      cursor: "pointer",
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
