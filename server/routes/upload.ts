import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from "../lib/cloudinary.js";

const router = Router();

// Images are uploaded to memory first, then streamed straight to Cloudinary
// (or, if Cloudinary isn't configured, saved to local disk as a fallback —
// see the README note about why local storage isn't ideal long-term).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "el-attar-products", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Multer errors (file too large, wrong type) come through here as JSON
// instead of Express's default HTML error page, which the frontend can't parse.
function uploadErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت)"
      : err.code === "LIMIT_UNEXPECTED_FILE"
      ? "حقل الصورة غير صحيح"
      : "فشل استلام الصورة";
    return res.status(400).json({ message });
  }
  if (err instanceof Error && err.message === "Only images allowed") {
    return res.status(400).json({ message: "الملف يجب أن يكون صورة فقط" });
  }
  next(err);
}

router.post("/image", requireAuth, upload.single("image"), uploadErrorHandler, async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "لم يتم إرسال أي صورة" });
  }

  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary is not configured. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in your .env file.");
    return res.status(500).json({ message: "خدمة رفع الصور غير مهيأة. يرجى مراجعة إعدادات الخادم." });
  }

  try {
    configureCloudinary();
    const url = await uploadBufferToCloudinary(req.file.buffer);
    return res.json({ url });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return res.status(500).json({ message: "فشل رفع الصورة على خدمة التخزين السحابي" });
  }
});

export default router;
