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
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password,
        captchaToken,
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      alert("✅ Admin login successful!");
      navigate("/admindashboard", { replace: true });
    } catch (err) {
      console.error(err);
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
        .github {
          background: #24292e;
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
        }
        .github:hover {
          background: #1a1e22;
          transform: scale(1.03);
        }
        .signup-btn {
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          padding: 8px;
          text-decoration: underline;
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
        }
        .back-btn:hover {
          color: #374151;
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

          <button className="github" onClick={handleGitHubLogin}>
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Sign in with GitHub
          </button>

          <button className="signup-btn" onClick={() => navigate("/adminsignup")}>
            Don't have an account? Sign up
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
