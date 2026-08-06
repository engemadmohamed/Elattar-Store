import { Router, Request, Response } from "express";
import { StoreSettings, defaultSettings } from "../models/StoreSettings.js";
import { requireAuth } from "../middleware/auth.js";
import { Customer } from "../models/Customer.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Review } from "../models/Review.js";

const router = Router();

// GET /api/settings — public
router.get("/", async (_req: Request, res: Response) => {
  try {
    let settings = await StoreSettings.findOne().sort({ createdAt: 1 });
    if (!settings) {
      settings = await StoreSettings.create(defaultSettings);
    }
    return res.json(settings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/settings/stats — calculate REAL live database metrics
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [customersCount, productsCount, categoriesCount, reviews] = await Promise.all([
      Customer.countDocuments({}),
      Product.countDocuments({}),
      Category.countDocuments({}),
      Review.find({}).lean(),
    ]);

    const reviewsCount = reviews.length;
    const avgRating = reviewsCount
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount) * 10) / 10
      : 0;

    return res.json({
      customersCount: customersCount || 0,
      productsCount: productsCount || 0,
      categoriesCount: categoriesCount || 0,
      reviewsCount: reviewsCount || 0,
      averageRating: avgRating,
    });
  } catch (error) {
    console.error("Stats calculation error:", error);
    return res.json({
      customersCount: 0,
      productsCount: 0,
      categoriesCount: 0,
      reviewsCount: 0,
      averageRating: 0,
    });
  }
});

// PUT /api/settings — admin only
router.put("/", requireAuth, async (req: Request, res: Response) => {
  try {
    let settings = await StoreSettings.findOne().sort({ createdAt: 1 });
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = await StoreSettings.create({ ...defaultSettings, ...req.body });
    }
    // Delete any extra documents to avoid duplicate settings records
    await StoreSettings.deleteMany({ _id: { $ne: settings._id } });
    return res.json(settings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
