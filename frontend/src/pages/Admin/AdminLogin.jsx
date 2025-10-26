import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      alert("✅ Admin login successful!");
      navigate("/admin-dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend admin Google login
    window.location.href = "http://localhost:5000/auth/admin/google";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body, html, #root { height: 100%; margin: 0; font-family: 'Montserrat', sans-serif; }
        .page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #111827;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          width: 380px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }
        h1 { color: #111827; margin-bottom: 10px; }
        p { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
        }
        button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        .primary {
          background: linear-gradient(90deg, #2563eb, #1d4ed8);
          color: #fff;
        }
        .primary:hover {
          background: linear-gradient(90deg, #1e40af, #1d4ed8);
        }
        .google {
          background: #fff;
          border: 1px solid #ddd;
          color: #444;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
        }
        .google:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
        }
        .error {
          color: red;
          margin-top: 12px;
        }
      `}</style>

      <div className="page">
        <div className="card">
          <h1>Admin Login</h1>
          <p>Sign in with your admin credentials</p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button className="google" onClick={handleGoogleLogin}>
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              style={{ width: "20px", height: "20px" }}
            />
            Sign in with Google
          </button>

          {message && <p className="error">{message}</p>}
        </div>
      </div>
    </>
  );
}
