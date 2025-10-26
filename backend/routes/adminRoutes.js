import express from "express";
import { adminSignup, adminLogin } from "../controllers/adminAuthController.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);

// ✅ Protected example route
router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({
    message: `Welcome Admin ${req.admin.name}`,
    email: req.admin.email,
    role: req.admin.role, // 👈 add this
  });
});


export default router;
