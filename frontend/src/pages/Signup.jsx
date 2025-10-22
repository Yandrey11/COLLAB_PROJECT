import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Handle input changes
  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };
  const handleSigninChange = (e) => {
    setSigninData({ ...signinData, [e.target.name]: e.target.value });
  };

  // Signup submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/signup",
        signupData,
        { headers: { "Content-Type": "application/json" } }
      );
      alert("Signup successful! Please log in.");
      console.log(res.data);
      setIsSignUp(false); // Switch to sign-in
    } catch (error) {
      console.error("Signup failed:", error.response?.data || error.message);
      alert("Signup failed: " + (error.response?.data?.message || error.message));
    }
  };

  // Signin submit
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/signin",
        signinData,
        { headers: { "Content-Type": "application/json" } }
      );

      // Assuming backend returns a token and user info
      const { token, user } = res.data;

      // Save token & user info in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Signin successful!");
      console.log("Logged in user:", user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Signin failed:", error.response?.data || error.message);
      alert("Signin failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        * { box-sizing: border-box; }

        body { background: #4f46e5; display: flex; justify-content: center; align-items: center; flex-direction: column; font-family: 'Montserrat', sans-serif; min-height: 100vh; margin: -20px 0 50px; }

        h1 { font-weight: bold; margin: 0; }
        h2 { text-align: center; }
        p { font-size: 14px; font-weight: 100; line-height: 20px; letter-spacing: 0.5px; margin: 20px 0 30px; }
        span { font-size: 12px; }
        a { color: #333; font-size: 14px; text-decoration: none; margin: 15px 0; }

        button { border-radius: 20px; border: 1px solid #FF4B2B; background-color: #FF4B2B; color: #FFFFFF; font-size: 12px; font-weight: bold; padding: 12px 45px; letter-spacing: 1px; text-transform: uppercase; transition: transform 80ms ease-in; }
        button:active { transform: scale(0.95); }
        button:focus { outline: none; }
        button.ghost { background-color: transparent; border-color: #FFFFFF; }

        form { background-color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 50px; height: 100%; text-align: center; }
        input { background-color: #eee; border: none; padding: 12px 15px; margin: 8px 0; width: 100%; }

        .container { background-color: #fff; border-radius: 10px; box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22); position: relative; overflow: hidden; width: 768px; max-width: 100%; min-height: 480px; height: auto; }
        .form-container { position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out; }
        .sign-in-container { left: 0; width: 50%; z-index: 2; }
        .container.right-panel-active .sign-in-container { transform: translateX(100%); }
        .sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }
        .container.right-panel-active .sign-up-container { transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s; }

        @keyframes show { 0%, 49.99% { opacity: 0; z-index: 1; } 50%, 100% { opacity: 1; z-index: 5; } }

        .overlay-container { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100; }
        .container.right-panel-active .overlay-container { transform: translateX(-100%); }

        .overlay { background: linear-gradient(to right, #FF4B2B, #FF416C); background-repeat: no-repeat; background-size: cover; background-position: 0 0; color: #FFFFFF; position: relative; left: -100%; height: 100%; width: 200%; transform: translateX(0); transition: transform 0.6s ease-in-out; }
        .container.right-panel-active .overlay { transform: translateX(50%); }

        .overlay-panel { position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 40px; text-align: center; top: 0; height: 100%; width: 50%; transform: translateX(0); transition: transform 0.6s ease-in-out; }
        .overlay-left { transform: translateX(-20%); }
        .container.right-panel-active .overlay-left { transform: translateX(0); }
        .overlay-right { right: 0; transform: translateX(0); }
        .container.right-panel-active .overlay-right { transform: translateX(20%); }

        .social-container { margin: 20px 0; }
        .social-container a { border: 1px solid #DDDDDD; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; margin: 0 5px; height: 40px; width: 40px; }

        // footer { background-color: #222; color: #fff; font-size: 14px; bottom: 0; position: fixed; left: 0; right: 0; text-align: center; z-index: 999; }
        // footer p { margin: 10px 0; }
        // footer i { color: red; }
        // footer a { color: #3c97bf; text-decoration: none; }
      `}</style>

      <div className={`container ${isSignUp ? "right-panel-active" : ""}`}>
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignupSubmit}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your email for registration</span>
            <input type="text" name="name" placeholder="Name" onChange={handleSignupChange} />
            <input type="email" name="email" placeholder="Email" onChange={handleSignupChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleSignupChange} />
            <button type="submit">Sign Up</button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSigninSubmit}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              
            </div>
            <span>or use your account</span>
            <input type="email" name="email" placeholder="Email" onChange={handleSigninChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleSigninChange} />
            <a href="#">Forgot your password?</a>
            <button type="submit">Login</button>
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={() => setIsSignUp(false)}>Login</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={() => setIsSignUp(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthForm;
