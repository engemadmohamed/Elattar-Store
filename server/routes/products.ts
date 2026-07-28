import { Router, Request, Response } from "express";
import QRCode from "qrcode";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function getBaseUrl(req: Request): string {
  // APP_BASE_URL is the most reliable source — set it in your .env / Vercel
  // environment variables to the public-facing shop URL (e.g. https://elattarstore.vercel.app).
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }
  // Vercel (and most reverse proxies) terminate TLS before the Node process,
  // so req.secure is always false. Use x-forwarded-proto instead.
  const proto =
    req.get("x-forwarded-proto")?.split(",")[0].trim() ||
    (req.secure ? "https" : "http");
  const host = req.get("host") || "localhost:5000";
  return `${proto}://${host}`;
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

// Regenerate QR codes for ALL products using the current APP_BASE_URL (admin only)
// Useful after deploying to a new domain — call once to fix any localhost URLs
// stored in the database.
router.post("/admin/regenerate-qr", requireAuth, async (req: Request, res: Response) => {
  try {
    const products = await Product.find({});
    const base = getBaseUrl(req);
    let updated = 0;
    for (const product of products) {
      const productUrl = `${base}/product/${product._id}`;
      const qrDataUrl = await QRCode.toDataURL(productUrl, { width: 300, margin: 2 });
      product.qrCode = qrDataUrl;
      await product.save();
      updated++;
    }
    return res.json({ message: `تم تحديث ${updated} منتج بنجاح`, updated, base });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "فشل إعادة توليد QR Codes" });
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
