import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, (req, res) => {
  res.json({
    message: "User dashboard accessed",
    user: req.user,
  });
});

export default router;
