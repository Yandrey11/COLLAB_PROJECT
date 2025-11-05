import express from "express";
import { adminSignup } from "../../controllers/admin/adminSignupController.js";
import { adminLogin } from "../../controllers/admin/adminLoginController.js";

import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);

// ✅ Protected example route
router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({
    message: `Welcome Admin ${req.admin.name}`,
    email: req.admin.email,
    role: req.admin.role,
  });
});

export default router;
