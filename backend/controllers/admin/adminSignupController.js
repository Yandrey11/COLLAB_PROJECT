import Admin from "../../models/Admin.js";
import jwt from "jsonwebtoken";

// 🟩 ADMIN SIGNUP (no reCAPTCHA)
export const adminSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({ name, email, password });

    // Generate JWT token for automatic login after signup
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "✅ Admin account created successfully",
      token, // Return token for automatic login
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("❌ Admin Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
