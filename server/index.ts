// Local development entry point.
// For Vercel production, see api/index.ts instead.
import "./env.js";

import { connectDB } from "./db.js";
import app from "./app.js";
import { serveStatic } from "./static.js";

const PORT = parseInt(process.env.PORT || "3001");

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is not set. Add it to your .env file.");
  process.exit(1);
}

// Serve React app in production (local prod build only; Vercel serves static files separately)
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  app.get("/", (_req, res) => {
    res.send("Al Mohandes API running. Start Vite dev server for the frontend.");
  });
}

import QRCode from "qrcode";
import { Product } from "./models/Product.js";

async function autoUpdateProductQRCodes() {
  try {
    const products = await Product.find({});
    for (const p of products) {
      const targetUrl = `https://almohandesstore.vercel.app/product/${p._id}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      p.qrCode = qrDataUrl;
      await p.save();
    }
    console.log(`[QR Auto Fix] ✅ Updated QR codes for ${products.length} products to https://almohandesstore.vercel.app`);
  } catch (err) {
    console.error("[QR Auto Fix Error]:", err);
  }
}

connectDB()
  .then(async () => {
    await autoUpdateProductQRCodes();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Al Mohandes Store API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
