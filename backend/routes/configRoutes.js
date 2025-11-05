import express from "express";
const router = express.Router();

router.get("/recaptcha", (req, res) => {
  res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
});

export default router;
