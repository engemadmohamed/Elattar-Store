import { Router, Request, Response } from "express";
import { StoreSettings, defaultSettings } from "../models/StoreSettings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/settings — public
router.get("/", async (_req: Request, res: Response) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create(defaultSettings);
    }
    return res.json(settings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/settings — admin only
router.put("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(settings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
