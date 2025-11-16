import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!captchaToken) {
      setMessage("⚠️ Please verify that you are not a robot.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔐 Attempting admin login for:", email);
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password,
        captchaToken,
      });

      console.log("✅ Login response received:", res.data);

      // Verify token exists in response
      if (!res.data.token) {
        console.error("❌ No token in response:", res.data);
        setMessage("⚠️ Login failed: No token received from server.");
        setLoading(false);
        return;
      }

      // Store token and admin data
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      // Verify token was stored
      const storedToken = localStorage.getItem("adminToken");
      if (!storedToken) {
        console.error("❌ Token not stored in localStorage");
        setMessage("⚠️ Failed to store token. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Token stored successfully, redirecting to dashboard");
      alert("✅ Admin login successful!");
      navigate("/admindashboard", { replace: true });
    } catch (err) {
      console.error("❌ Login error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setMessage(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/admin/google";
  };

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5000/auth/admin/github";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        html, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          font-family: 'Montserrat', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #111827;
          overflow-x: hidden;
        }
        .page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 36px 28px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }
        h1 { color: #111827; margin-bottom: 10px; }
        p { color: #6b7280; font-size: 14px; margin-bottom: 18px; }
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
        .google, .github {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: 0.15s ease;
          padding: 10px;
        }
        .google {
          background: #fff;
          border: 1px solid #ddd;
          color: #444;
        }
        .google:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }
        .github {
          background: #24292e;
          color: #fff;
        }
        .github:hover {
          background: #1a1e22;
          transform: translateY(-2px);
        }
        .signup-btn {
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          padding: 8px;
          text-decoration: underline;
          margin-top: 10px;
        }
        .signup-btn:hover {
          color: #1d4ed8;
        }
        .back-btn {
          background: transparent;
          color: #6b7280;
          font-size: 12px;
          padding: 8px;
          text-decoration: none;
          margin-top: 8px;
        }
        .back-btn:hover {
          color: #374151;
        }
        .error {
          color: red;
          margin-top: 12px;
        }

        /* ensure icons/images inside buttons are aligned and responsive */
        .google img, .github img {
          width: 20px;
          height: 20px;
          display: inline-block;
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

            {/* ✅ Google reCAPTCHA */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <ReCAPTCHA
                sitekey="6Lf98vErAAAAAFBhvxrQnb4NCHHLXwYb-QOlKSQ3"
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>

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

          

         

          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Landing Page
          </button>

          {message && <p className="error">{message}</p>}
        </div>
      </div>
    </>
  );
}
