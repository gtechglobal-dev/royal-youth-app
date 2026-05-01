import express from "express";
import { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner, upload } from "../controllers/bannerController.js";

const router = express.Router();

router.get("/", getBanners);
router.get("/all", getAllBanners);
router.post("/", upload.single("image"), createBanner);
router.put("/:id", upload.single("image"), updateBanner);
router.delete("/:id", deleteBanner);

export default router;
