import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { validatePassword } from "../utils/passwordValidation";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
      setUseToken(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validation
    if (!newPassword) {
      setMessage("New password is required");
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

    try {
      const payload = useToken
        ? { email, token, newPassword }
        : { email, code, newPassword };

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.post(`${baseUrl}/api/reset/reset-password`, payload);

      setMessage(res.data.message || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '0.75rem', width: '24rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem' }}>
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!useToken && (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  border: '1px solid #d1d5db', 
                  padding: '0.5rem', 
                  borderRadius: '0.25rem',
                  outline: 'none'
                }}
                required
              />

              <input
                type="text"
                placeholder="Enter 6-digit reset code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ 
                  width: '100%', 
                  border: '1px solid #d1d5db', 
                  padding: '0.5rem', 
                  borderRadius: '0.25rem',
                  outline: 'none'
                }}
                required
              />
            </>
          )}

          {useToken && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '0.5rem', 
              marginBottom: '0.5rem' 
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                Resetting password for: <strong>{email}</strong>
              </p>
            </div>
          )}

          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => {
              const value = e.target.value;
              setNewPassword(value);
              const result = validatePassword(value, { email });
              setPasswordErrors(result.errors);
            }}
            style={{ 
              width: '100%', 
              border: '1px solid #d1d5db', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              outline: 'none'
            }}
            required
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#60a5fa' : '#2563eb',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '1rem',
            color: message.includes("Failed") ? '#dc2626' : '#16a34a'
          }}>
            {message}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#4b5563' }}>
          Remembered your password?{" "}
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
