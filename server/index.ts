import "./env.js";

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import customerAuthRoutes from "./routes/customerAuth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import reviewRoutes from "./routes/reviews.js";
import uploadRoutes from "./routes/upload.js";
import { serveStatic } from "./static.js";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is not set. Add it to your .env file.");
  process.exit(1);
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded images. UPLOADS_DIR (set in .env) can point this at a
// fixed folder outside the project directory, so re-downloading/replacing
// the project folder later doesn't strand already-uploaded product images.
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer-auth", customerAuthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "El Attar Store" });
});

// Serve React app in production
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  // In dev, all non-API routes return a simple message (Vite handles the frontend)
  app.get("/", (_req, res) => {
    res.send("El Attar API running. Start Vite dev server for the frontend.");
  });
}

// Connect DB then start
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 El Attar Store API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
