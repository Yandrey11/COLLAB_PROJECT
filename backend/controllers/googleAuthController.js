import jwt from "jsonwebtoken";

export const googleAuthSuccess = (req, res) => {
  try {
    // ⚠️ No authenticated user found
    if (!req.user) {
      console.warn("❌ Google auth success endpoint hit, but no user in session");
      return res.redirect("http://localhost:5173/login?error=unauthorized");
    }

    // ✅ Create a signed JWT that contains user info
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        googleId: req.user.googleId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`✅ Google login success for ${req.user.email}`);

    // ✅ Redirect back to the dashboard with the token
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
  } catch (err) {
    console.error("❌ Error in googleAuthSuccess:", err);
    res.redirect("http://localhost:5173/login?error=server_error");
  }
};

export const googleAuthFailure = (req, res) => {
  console.warn("❌ Google authentication failed");
  res.redirect("http://localhost:5173/login?error=google_auth_failed");
};
