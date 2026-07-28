// Vercel serverless entry point.
// Vercel compiles this file automatically with @vercel/node.
// All /api/* requests are rewritten here by vercel.json.
import type { IncomingMessage, ServerResponse } from "http";
import { connectDB } from "../server/db.js";
import app from "../server/app.js";

let dbReady = false;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
  // Express apps are directly callable as (req, res) handlers.
  // Vercel waits for res.end() — no need to return a promise.
  app(req as any, res as any);
}
