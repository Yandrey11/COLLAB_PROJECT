import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Swal from "sweetalert2";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  // ✅ Your reCAPTCHA site key
  const SITE_KEY = "6Lf-8vErAAAAAGohFk-EE6OaLY60jkwo1gTH05B7";

  const handleSubmit = async (e) => {
    e.preventDefault();

    

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
        recaptchaToken, // ✅ match backend variable name
      });

      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("token", res.data.token); // Store as both for consistency
      localStorage.setItem("user", JSON.stringify(res.data.user || res.data.result));

      await Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Welcome back!",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.response?.data?.message || "Invalid email or password",
      });
    }
  };
  const handleFacebookLogin = () => {
  window.location.href = "http://localhost:5000/auth/facebook";
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,600,700&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        .page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eef2ff, #c7d2fe);
          font-family: 'Montserrat', sans-serif;
          padding: 32px 16px;
        }
        .cardWrapper {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 25px 70px rgba(79, 70, 229, 0.15);
          padding: 48px 40px;
        }
        .formSection {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .heading h1 {
          margin: 0;
          font-size: 28px;
          color: #111827;
        }
        .heading p {
          margin: 6px 0 0 0;
          color: #6b7280;
          font-size: 15px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          font-size: 15px;
          background: #f9fafb;
          transition: border 0.2s ease;
        }
        input:focus {
          outline: none;
          border-color: #4f46e5;
          background: #fff;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          font-size: 13px;
        }
        .link {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }
        .primaryBtn {
          border: none;
          background: linear-gradient(120deg,#4f46e5,#7c3aed);
          color: #fff;
          padding: 14px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .primaryBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 25px rgba(79,70,229,0.25);
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af;
          letter-spacing: 0.08em;
        }
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .socialButtons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .socialBtn,
        .googleBtn {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          cursor: pointer;
          color: #374151;
          text-decoration: none;
          transition: border 0.2s ease, transform 0.15s ease;
        }
        .socialBtn:hover,
        .googleBtn:hover {
          transform: translateY(-1px);
          border-color: #c7d2fe;
        }
        .backBtn {
          align-self: flex-start;
          background: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          padding: 8px 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .signupBtn {
          background: #fff;
          color: #4f46e5;
          border: 1px solid #dbeafe;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .metaInfo {
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
        }
        @media (max-width: 520px) {
          .cardWrapper {
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="page">
        <div className="cardWrapper" role="main">
          <section className="formSection" aria-label="Login form">
            <button
              type="button"
              className="backBtn"
              onClick={() => navigate("/")}
              aria-label="Go back to landing page"
            >
              ← Go Back
            </button>

            <div className="heading">
              <h1>Welcome back</h1>
              <p>Sign in to access records, reports, notifications, and more.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <ReCAPTCHA
                sitekey={SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                style={{ alignSelf: "center" }}
              />

              <div className="actions">
                <a className="link" href="./forgot-password">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="primaryBtn">
                Log in to Dashboard
              </button>

              <div className="divider">
                <span>or continue with</span>
              </div>

              <div className="socialButtons">
                <button
                  type="button"
                  className="googleBtn"
                  onClick={() => {
                    window.location.href = "http://localhost:5000/auth/google";
                  }}
                  aria-label="Sign in with Google"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google" width="18" />
                  Google
                </button>
              </div>

              <button
                type="button"
                className="signupBtn"
                onClick={() => navigate("/signup")}
              >
                Create a counselor account
              </button>

            
            </form>
          </section>
        </div>
      </div>
    </>
  );
}

export default Login;
