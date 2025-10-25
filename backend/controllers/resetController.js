import nodemailer from "nodemailer";
import User from "../models/User.js";

// ✅ Forgot Password — send code to user's email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // ✅ FIX: define 'email' properly

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("📩 Forgot password request for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found in DB");
      return res.status(404).json({ message: "No user found with this email" });
    }

    // ✅ Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // ✅ Send via Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}. It will expire in 10 minutes.`,
    };

    console.log("📨 Sending email to:", email);
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");

    res.status(200).json({ message: "✅ Reset code sent! Please check your email." });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to send reset code." });
  }
};



// ✅ Reset Password — verify code and update password
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset code" });

    // Update password (hashed automatically in User.js pre-save hook)
    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "✅ Password has been reset successfully!" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
