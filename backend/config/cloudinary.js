import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const hasCloudinary = cloudName && cloudName !== "Root" && cloudName !== "your-cloud-name";

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadMiddleware = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadToCloudinary = async (fileBuffer, mimeType) => {
  if (!hasCloudinary || !fileBuffer || fileBuffer.length === 0) {
    return null;
  }
  
  const base64Data = fileBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64Data}`;
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      { folder: "royal-youth" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

export { uploadToCloudinary };
export default uploadMiddleware;