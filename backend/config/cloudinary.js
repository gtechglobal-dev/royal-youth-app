import multer from "multer";

const uploadMiddleware = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default uploadMiddleware;