import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from "../lib/cloudinary.js";

const router = Router();

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  const customerToken = req.headers["x-customer-token"] as string;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return res.status(500).json({ message: "JWT Secret not configured" });
  }

  try {
    if (adminToken && adminToken !== "null" && adminToken !== "undefined") {
      jwt.verify(adminToken, JWT_SECRET);
    } else if (customerToken) {
      jwt.verify(customerToken, JWT_SECRET);
    } else {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    return next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "el-attar-categories", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

function uploadErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "حجم الصورة كبير جدًا (الحد الأقصى 10 ميجابايت)"
        : "فشل استلام الصورة";
    return res.status(400).json({ message });
  }
  if (err instanceof Error && err.message === "Only images allowed") {
    return res.status(400).json({ message: "الملف يجب أن يكون صورة فقط" });
  }
  next(err);
}

router.post("/image", checkAuth, upload.single("image"), uploadErrorHandler, async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "لم يتم إرسال أي صورة" });
  }

  // 1. Try Cloudinary if configured
  if (isCloudinaryConfigured()) {
    try {
      configureCloudinary();
      const url = await uploadBufferToCloudinary(req.file.buffer);
      return res.json({ url });
    } catch (error) {
      console.error("Cloudinary upload error, falling back to local storage:", error);
    }
  }

  // 2. Fallback to Local Filesystem Storage (/uploads/)
  try {
    const uploadsDir = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || ".png";
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    const publicUrl = `/uploads/${filename}`;
    console.log(`[Local Upload Success]: Saved ${filename} to ${publicUrl}`);

    return res.json({ url: publicUrl });
  } catch (localErr) {
    console.error("Local file upload error, falling back to Base64:", localErr);
    // 3. Fallback to Base64 Data URL
    const mime = req.file.mimetype || "image/png";
    const base64 = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    return res.json({ url: base64 });
  }
});

export default router;
