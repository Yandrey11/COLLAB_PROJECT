import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validatePassword } from "../utils/passwordValidation";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function SetPassword() {
  useDocumentTitle("Set Password");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam || !emailParam) {
      setMessage("Invalid link. Please contact support.");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validation
    if (!newPassword) {
      setMessage("Password is required");
      setLoading(false);
      return;
    }

    const validation = validatePassword(newPassword, { email });
    if (!validation.isValid) {
      setPasswordErrors(validation.errors);
      setMessage("Password does not meet the security requirements.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!token || !email) {
      setMessage("Invalid link. Please contact support.");
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.post(`${baseUrl}/api/reset/set-password`, {
        token,
        email,
        newPassword,
      });

      setMessage(res.data.message || "Password set successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Set password error:", err);
      setMessage(err.response?.data?.message || "Failed to set password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff, #c7d2fe)",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "1.5rem",
            color: "#111827",
          }}
        >
          Set Your Password
        </h2>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "1rem",
              backgroundColor: message.includes("successfully") ? "#d1fae5" : "#fee2e2",
              color: message.includes("successfully") ? "#065f46" : "#991b1b",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              New Password *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                const value = e.target.value;
                setNewPassword(value);
                const result = validatePassword(value, { email });
                setPasswordErrors(result.errors);
              }}
              placeholder="Enter your new password"
              required
              style={{
                width: "100%",
                padding: "10px 15px",
                borderRadius: "10px",
                border: "1px solid #e6e9ef",
                outline: "none",
                fontSize: "14px",
              }}
            />
            <div className="mt-1">
              <PasswordStrengthMeter password={newPassword} email={email} />
            </div>
            {passwordErrors.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                {passwordErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              style={{
                width: "100%",
                padding: "10px 15px",
                borderRadius: "10px",
                border: "1px solid #e6e9ef",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token || !email}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: loading || !token || !email
                ? "#cbd5e0"
                : "linear-gradient(90deg, #06b6d4, #3b82f6)",
              color: "white",
              cursor: loading || !token || !email ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          <a
            href="/login"
            style={{ color: "#4f46e5", textDecoration: "none" }}
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

