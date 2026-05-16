import Banner from "../models/banner.js";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

const uploadMiddleware = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."), false);
    }
  },
});

export const upload = uploadMiddleware;

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { title, link, order, isActive } = req.body;
    let image = "";
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) {
        image = result.secure_url;
      }
    }
    
    const banner = new Banner({ title, image, link, order, isActive });
    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { title, link, order, isActive } = req.body;
    const updateData = { title, link, order, isActive };
    
    if (req.file) {
      const current = await Banner.findById(req.params.id);
      await deleteFromCloudinary(current?.image);
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) {
        updateData.image = result.secure_url;
      }
    }
    
    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { returnDocument: "after" });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (banner) {
      await deleteFromCloudinary(banner.image);
    }
    res.json({ message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
