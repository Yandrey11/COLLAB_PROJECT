import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/reset/reset-password", {
        email,
        code,
        newPassword,
      });

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

          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ 
              width: '100%', 
              border: '1px solid #d1d5db', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              outline: 'none'
            }}
            required
          />

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
