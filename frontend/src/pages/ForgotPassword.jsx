import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function ForgotPassword() {
  useDocumentTitle("Forgot Password");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.post(`${baseUrl}/api/reset/forgot-password`, { email });
      setMessage(res.data.message || "Reset code sent! Check your email.");
      setTimeout(() => navigate("/reset-password"), 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage(err.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        borderRadius: '0.75rem', 
        width: '24rem' 
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '1.5rem' 
        }}>
          Forgot Password
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
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b82f6'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
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
              backgroundColor: loading ? '#60a5fa' : '#2563eb',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
          >
            {loading ? "Sending..." : "Send Reset Code"}
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

        <p style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          color: '#4b5563' 
        }}>
          Remembered your password?{" "}
          <Link to="/login" style={{ 
            color: '#2563eb', 
            textDecoration: 'none' 
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
