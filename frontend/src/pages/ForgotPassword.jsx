import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // ✅ fixed port: your backend runs on 5000, not 6000
      const res = await axios.post("http://localhost:5000/api/reset/forgot-password", { email });
      setMessage(res.data.message || "Reset code sent! Check your email.");

      // ✅ wait a bit before redirecting to reset-password page
      setTimeout(() => navigate("/reset-password"), 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage(err.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-xl w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 ${
              message.includes("Failed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center mt-6 text-gray-600">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
