import express from "express";
import protect from "../middleware/authMiddleware.js";
import { markDues, getUserDues } from "../controllers/duesController.js";

const router = express.Router();

router.post("/mark", protect, markDues);

router.get("/my-dues", protect, getUserDues);

router.get("/:memberId", async (req, res) => {
  const dues = await Dues.find({
    memberId: req.params.memberId,
  });

  res.json(dues);
});

export default router;
