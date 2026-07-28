// Loading dotenv here, in its own module, and importing this file FIRST in
// server/index.ts guarantees process.env is populated before any other
// route/model module is evaluated. (ES module imports are hoisted and run
// before the importing file's own top-level code, so calling
// `dotenv.config()` directly inside index.ts was running too late.)
import dotenv from "dotenv";
dotenv.config();
