import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

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

      alert("✅ Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Invalid email or password");
    }
  };
  const handleFacebookLogin = () => {
  window.location.href = "http://localhost:5000/auth/facebook";
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        .page {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6f5f7;
          font-family: 'Montserrat', sans-serif;
          padding: 24px;
          margin: 0;
          box-sizing: border-box;
        }
        .card {
          width: 380px;
          max-width: 100%;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          padding: 32px;
          text-align: center;
        }
        h1 { margin: 0 0 12px 0; font-size: 24px; color: #333; }
        p { margin: 0 0 20px 0; color: #666; font-size: 14px; }
        form { display: flex; flex-direction: column; gap: 10px; }
        input {
          padding: 12px 14px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          background: #000000ff;
          font-size: 14px;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .link {
          color: #666;
          font-size: 13px;
          text-decoration: none;
        }
        button {
          margin-top: 12px;
          border: none;
          background: linear-gradient(90deg,#FF4B2B,#FF416C);
          color: #fff;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        button:hover {
          transform: scale(1.03);
        }
        /* Secondary signup button */
        .signupBtn {
          background: #fff;
          color: #FF416C;
          border: 2px solid #FF416C;
          padding: 10px;
          margin-top: 8px;
        }
        .signupBtn:hover {
          transform: scale(1.03);
          background: rgba(255,65,108,0.04);
        }
        /* Google login button */
        .googleBtn {
          background: #fff;
          color: #444;
          border: 1px solid #ddd;
          padding: 10px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .googleBtn:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .backBtn {
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
          padding: 8px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .backBtn:hover {
          transform: scale(1.02);
          background: rgba(0,0,0,0.02);
          border-color: #999;
        }
        @media (max-width: 420px) {
          .card { padding: 20px; width: 100%; }
        }
      `}</style>

      <div className="page">
        <div className="card" role="main">
          <button
            type="button"
            className="backBtn"
            onClick={() => navigate("/")}
            aria-label="Go back to landing page"
          >
            ← Go Back
          </button>
          <h1>Log In</h1>
          <p>Use your account to access the dashboard</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {/* ✅ reCAPTCHA component */}
            <ReCAPTCHA
              sitekey={SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
              style={{ marginTop: "10px", alignSelf: "center" }}
            />

            <div className="actions">
              <a className="link" href="./forgot-password">Forgot password?</a>
            </div>
            <button type="submit">LOGIN</button>

            {/* Google login button */}
            <button
              type="button"
              className="googleBtn"
              onClick={() => {
                // Redirect to backend OAuth endpoint to start Google sign-in flow
                window.location.href = "http://localhost:5000/auth/google";
                }}
                aria-label="Sign in with Google"
              >
                Login in with Google
              </button>

              <a
                href="http://localhost:5000/auth/github"
                className="googleBtn"
                aria-label="Login with GitHub"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}
              >
                <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="github" width="20" />
                Login with GitHub
              </a>

              {/* New signup button below the Sign In button */}
            <button
              type="button"
              className="signupBtn"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
            
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
