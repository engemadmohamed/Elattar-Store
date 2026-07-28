import { Router, Request, Response } from "express";
import QRCode from "qrcode";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function getBaseUrl(req: Request): string {
  // In dev, the browser talks to the Vite server (port 5000) which proxies
  // /api requests to this API server (port 3001) — that proxy rewrites the
  // Host header, so req.get("host") would incorrectly return the API's own
  // port. APP_BASE_URL (set in .env) is the reliable source of truth for
  // the public-facing shop URL that QR codes should point to.
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }
  const host = req.get("host") || "localhost:5000";
  const protocol = req.secure ? "https" : "http";
  return `${protocol}://${host}`;
}

// Get all products (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, sort, onSale, page = 1, limit = 24 } = req.query;

    const filter: Record<string, unknown> = { isActive: true };

    if (category) filter.categoryId = category;
    if (subcategory) filter.subcategoryId = subcategory;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }
    if (onSale === "true") {
      filter.salePrice = { $exists: true, $ne: null, $gt: 0 };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { nameAr: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    type SortOrder = 1 | -1;
    let sortQuery: Record<string, SortOrder> = { createdAt: -1 };
    if (sort === "price_asc") sortQuery = { price: 1 };
    else if (sort === "price_desc") sortQuery = { price: -1 };
    else if (sort === "name") sortQuery = { name: 1 };
    else if (sort === "best_selling") sortQuery = { soldCount: -1 };
    else if (sort === "top_rated") sortQuery = { ratingAverage: -1, ratingCount: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery as Record<string, 1 | -1>).skip(skip).limit(Number(limit)).populate("categoryId", "name nameAr"),
      Product.countDocuments(filter),
    ]);

    return res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: get all products (including inactive) — must be before /:id
router.get("/admin/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("categoryId", "name nameAr"),
      Product.countDocuments(filter),
    ]);
    return res.json({ products, total });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Get single product by ID (public) - this is the QR target page
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = await Product.findById(req.params.id).populate("categoryId", "name nameAr").populate("subcategoryId", "name nameAr");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    console.error("Failed to get product by ID:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Generate QR code for a product (public - returns data URL)
router.get("/:id/qr", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const productUrl = `${getBaseUrl(req)}/product/${product._id}`;
    const qrDataUrl = await QRCode.toDataURL(productUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return res.json({ qrCode: qrDataUrl, url: productUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to generate QR code" });
  }
});

// Create product (admin only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Check SKU uniqueness
    const existing = await Product.findOne({ sku: data.sku });
    if (existing) return res.status(400).json({ message: "SKU already exists" });

    const product = new Product(data);
    await product.save();

    // Generate QR code immediately
    const productUrl = `${getBaseUrl(req)}/product/${product._id}`;
    const qrDataUrl = await QRCode.toDataURL(productUrl, { width: 300, margin: 2 });
    product.qrCode = qrDataUrl;
    await product.save();

    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update product (admin only)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete product (admin only)
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Related products (same category, excluding this product) — shown on the
// product page and after adding to cart
router.get("/:id/related", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Strictly the same category (or same subcategory) — never cross into
    // unrelated categories just to pad out the list
    const related = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { categoryId: product.categoryId },
        ...(product.subcategoryId ? [{ subcategoryId: product.subcategoryId }] : []),
      ],
    })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(8)
      .populate("categoryId", "name nameAr");

    return res.json(related);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
