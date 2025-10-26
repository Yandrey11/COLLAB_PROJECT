import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("adminToken", tokenFromUrl);
      window.history.replaceState({}, document.title, "/admindashboard");
    }

    const fetchAdmin = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("⚠️ No admin token found. Please log in.");
        navigate("/admin-login", { replace: true });
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.role !== "admin") {
          alert("🚫 Access denied. Admins only!");
          localStorage.removeItem("adminToken");
          navigate("/login", { replace: true });
        } else {
          setAdmin(res.data);
        }
      } catch (err) {
        console.error("❌ Admin verification failed:", err);
        localStorage.removeItem("adminToken");
        navigate("/admin-login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [navigate]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("adminToken");
      navigate("/adminlogin", { replace: true });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #6a11cb, #8e62ff)",
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
        fontFamily: "Poppins, sans-serif",
        color: "#333",
      }}
    >
      {/* ✅ Sidebar */}
      <aside
        style={{
          width: "240px",
          background: "linear-gradient(180deg, #4b2edf, #6b4eff)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontWeight: "700",
            fontSize: "22px",
          }}
        >
          Admin Panel
        </h2>

        <nav style={{ flex: 1 }}>
          {["Overview", "Users", "Counselors", "Reports", "Settings"].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 15px",
                margin: "6px 0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "0.3s",
                backgroundColor: item === "Overview" ? "rgba(255,255,255,0.2)" : "transparent",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor =
                  item === "Overview" ? "rgba(255,255,255,0.2)" : "transparent")
              }
            >
              {item}
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ff4b4b",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "auto",
          }}
        >
          Logout
        </button>
      </aside>

      {/* ✅ Main content */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#f8f8ff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            background: "#fff",
            padding: "15px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              width: "250px",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span>🔔</span>
            {admin && (
              <span style={{ fontWeight: "600", color: "#555" }}>{admin.name}</span>
            )}
          </div>
        </header>

        {/* Stats cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            padding: "30px",
          }}
        >
          {[
            { title: "Total Users", value: "1,234", color: "#6b4eff" },
            { title: "Active Counselors", value: "87", color: "#4b2edf" },
            { title: "Pending Approvals", value: "12", color: "#ffb100" },
            { title: "System Health", value: "✅ Stable", color: "#22bb33" },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  color: "#666",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  color: card.color,
                  fontSize: "26px",
                  fontWeight: "700",
                  marginTop: "10px",
                }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </section>

        {/* Chart placeholder */}
        <section
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            margin: "0 30px 30px",
            padding: "30px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "10px", fontWeight: "600" }}>User Growth (Monthly)</h3>
          <p style={{ color: "#777" }}>📈 Chart visualization coming soon...</p>
        </section>
      </main>
    </div>
  );
}
