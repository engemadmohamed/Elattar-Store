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

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Al Mohandes Store API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
