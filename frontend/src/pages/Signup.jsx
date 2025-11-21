import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { validatePassword } from "../utils/passwordValidation.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";

function Signup() {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [passwordErrors, setPasswordErrors] = useState([]);

  const navigate = useNavigate();

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData({ ...signupData, [name]: value });

    if (name === "password") {
      const result = validatePassword(value);
      setPasswordErrors(result.errors);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors([]);

    const validation = validatePassword(signupData.password);
    if (!validation.isValid) {
      setPasswordErrors(validation.errors);
      Swal.fire({
        icon: "error",
        title: "Password requirements not met",
        html: `<ul style="text-align:left;margin:0;padding-left:1.2rem;">${validation.errors
          .map((err) => `<li>${err}</li>`)
          .join("")}</ul>`,
      });
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup", // ✅ fixed URL
        signupData,
        { headers: { "Content-Type": "application/json" } }
      );

      Swal.fire({
        icon: "success",
        title: "Signup Successful!",
        text: "Your account has been created successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      console.log(res.data);

      if (res.data?.token) {
        localStorage.setItem("authToken", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
      }

      navigate("/login");
    } catch (error) {
      console.error("Signup failed:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: error.response?.data?.message || error.message,
      });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: #eef2ff; }
        /* Ensure the page wrapper fills the viewport and centers its content */
        .page { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
        .card { width: 420px; max-width: 100%; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,0.12); padding: 32px; }
        .title { margin: 0 0 12px; font-size: 22px; color: #111827; font-weight: 800; text-align: center; }
        .subtitle { margin: 0 0 20px; font-size: 13px; color: #6b7280; text-align: center; }
        form { display: grid; gap: 12px; }
        label { font-size: 12px; color: #374151; }
        input { width: 100%; padding: 12px 1px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 14px; background: #070707ff; }
        input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.06); }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(90deg,#7c3aed,#4f46e5); color: #fff; font-weight: 700; cursor: pointer; }
        .small { text-align: center; margin-top: 8px; font-size: 13px; color: #6b7280; }
        .socials { display:flex; gap:10px; justify-content:center; margin-bottom:6px; }
        .social { width:38px; height:38px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#f3f4f6; color:#374151; text-decoration:none; }
        @media (max-width: 480px) {
          .card { padding: 20px; }
        }
      `}</style>

      <div className="page">
        <div className="card" role="region" aria-labelledby="signup-title">
          <h1 id="signup-title" className="title">Create your account</h1>
          <p className="subtitle">Sign up to start collaborating — it's quick and free.</p>

          <form onSubmit={handleSignupSubmit} aria-label="Signup form">
            <div>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Choose a strong password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
              />
              <div className="mt-1">
                <PasswordStrengthMeter password={signupData.password} />
              </div>
              {passwordErrors.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                  {passwordErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn">Create Account</button>

            {/* New button that redirects to login */}
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate("/login")}
              aria-label="Go to login"
            >
              Already have an account? Log in
            </button>
          </form>

          <div className="small">
            <div className="socials" aria-hidden="true">
              <span className="social"><i className="fab fa-google"></i></span>
              <span className="social"><i className="fab fa-github"></i></span>
              <span className="social"><i className="fab fa-linkedin-in"></i></span>
            </div>
            By creating an account you agree to our terms.
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
