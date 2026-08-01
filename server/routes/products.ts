import { Router, Request, Response } from "express";
import QRCode from "qrcode";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { Category } from "../models/Category.js";

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
    const { category, search, minPrice, maxPrice, sort, onSale, page = 1, limit = 24 } = req.query;

    const filter: Record<string, unknown> = { isActive: true };

    if (category) {
      // Find the category by slug to get its ID
      const parentCategory = await Category.findOne({ slug: category as string });
      if (parentCategory) {
        // Find all descendant categories including the parent itself.
        // This is an iterative approach to avoid stack overflows on deep or cyclical category trees.
        const allCategories = await Category.find({}).lean();
        const getDescendantIds = (rootId: mongoose.Types.ObjectId): mongoose.Types.ObjectId[] => {
          const ids: mongoose.Types.ObjectId[] = [rootId];
          const queue: string[] = [rootId.toString()];
          const visited = new Set<string>(queue);

          while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = allCategories.filter(c => c.parentId?.toString() === currentId);
            for (const child of children) {
              const childIdStr = child._id.toString();
              if (!visited.has(childIdStr)) {
                visited.add(childIdStr);
                ids.push(child._id);
                queue.push(childIdStr);
              }
            }
          }
          return ids;
        };
        const categoryIds = getDescendantIds(parentCategory._id);
        filter.categoryId = { $in: categoryIds };
      } else {
        // If slug is not found, return no products for this category filter
        filter.categoryId = new mongoose.Types.ObjectId();
      }
    }
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
    const { page = 1, limit = 50, search, category } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { nameAr: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      const allCategories = await Category.find({}).lean();
      const getDescendantIds = (rootId: mongoose.Types.ObjectId): mongoose.Types.ObjectId[] => {
        const ids: mongoose.Types.ObjectId[] = [rootId];
        const queue: string[] = [rootId.toString()];
        const visited = new Set<string>(queue);

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const children = allCategories.filter(c => c.parentId?.toString() === currentId);
          for (const child of children) {
            const childIdStr = child._id.toString();
            if (!visited.has(childIdStr)) {
              visited.add(childIdStr);
              ids.push(child._id);
              queue.push(childIdStr);
            }
          }
        }
        return ids;
      };
      const categoryIds = getDescendantIds(new mongoose.Types.ObjectId(category as string));
      filter.categoryId = { $in: categoryIds };
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
    const productId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = await Product.findById(productId).populate("categoryId", "name nameAr slug");
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

    // Auto-generate SKU if not provided
    if (!data.sku) {
      data.sku = "EL-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, "0");
    }

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

    // Repopulate to match the PUT/GET response structure for the client cache
    const populatedProduct = await Product.findById(product._id).populate("categoryId", "name nameAr slug");

    return res.status(201).json(populatedProduct);
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `خطأ في البيانات: ${messages.join(', ')}` });
    }
    return res.status(500).json({ message: "فشل حفظ المنتج. تأكد من أن كل البيانات صحيحة.", error: String(error) });
  }
});

// Update product (admin only)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("categoryId", "name nameAr slug");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `خطأ في البيانات: ${messages.join(', ')}` });
    }
    return res.status(500).json({ message: "فشل تحديث المنتج. تأكد من أن كل البيانات صحيحة.", error: String(error) });
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
      categoryId: product.categoryId,
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
