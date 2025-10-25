import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    (async () => {
      // ✅ Step 1: Check if token was passed via Google redirect URL
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromURL = urlParams.get("token");

      if (tokenFromURL) {
        console.log("🔑 Received Google token from URL");
        localStorage.setItem("token", tokenFromURL);

        // ✅ Optionally clean up the URL
        window.history.replaceState({}, document.title, "/dashboard");
      }

      // ✅ Step 2: Get token (from localStorage or Google)
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("🚫 No token found, redirecting to login...");
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn("🚫 Token validation failed:", res.status);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
        } else {
          const data = await res.json();
          const resolvedUser = data.user ?? data;
          setUser(resolvedUser);
          localStorage.setItem("user", JSON.stringify(resolvedUser));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching user from backend:", err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, 100);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [navigate]);


  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      console.log("Logout clicked!");
      const token = localStorage.getItem("authToken");

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
      localStorage.removeItem("user");
      alert("You have been logged out!");
      navigate("/login", { replace: true });
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
          fontFamily: "sans-serif",
        }}
      >
        <h2>Loading dashboard...</h2>
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
        justifyContent: "center",
        background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "40px 60px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          maxWidth: "480px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#4f46e5", marginBottom: "10px" }}>
          Welcome to Your Dashboard 🎉
        </h1>

        {user ? (
          <>
            <p style={{ color: "#333", marginBottom: "8px" }}>Logged in as:</p>
            <p
              style={{
                color: "#111827",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              {user.name}
            </p>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>{user.email}</p>
          </>
        ) : (
          <p style={{ color: "#6b7280" }}>Welcome back!</p>
        )}

        <button
          onClick={handleLogout}
          style={{
            marginTop: "30px",
            padding: "12px 28px",
            background: "linear-gradient(90deg,#ef4444,#dc2626)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            transition: "transform 0.15s ease-in-out",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
