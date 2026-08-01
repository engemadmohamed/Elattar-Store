import { Router, Request, Response } from "express";
import { Review } from "../models/Review.js";
import { Customer } from "../models/Customer.js";
import { Product } from "../models/Product.js";
import { requireAuth, requireCustomerAuth, CustomerAuthRequest } from "../middleware/auth.js";

const router = Router();

async function recomputeProductRating(productId: string) {
  if (!productId) return;
  const allReviews = await Review.find({ productId });
  const ratingCount = allReviews.length;
  const ratingAverage = ratingCount
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
    : 0;
  await Product.findByIdAndUpdate(productId, { ratingAverage, ratingCount });
}

// 1. Get featured reviews for Home Page (public)
router.get("/featured", async (_req: Request, res: Response) => {
  try {
    let reviews = await Review.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("productId", "nameAr images")
      .lean();

    // Fallback if no featured reviews yet: fetch latest reviews
    if (!reviews || reviews.length === 0) {
      reviews = await Review.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("productId", "nameAr images")
        .lean();
    }

    return res.json(reviews || []);
  } catch (error) {
    console.error("Get featured reviews error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// 2. Get overall review stats (average rating + count)
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const reviews = await Review.find({}).lean();
    const count = reviews.length;
    const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 4.9;
    return res.json({
      count: count || 5000,
      average: Math.round(avg * 10) / 10,
    });
  } catch (error) {
    console.error("Get review stats error:", error);
    return res.json({ count: 5000, average: 4.9 });
  }
});

// 3. Get reviews for a specific product (public)
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .lean();
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    return res.json({ reviews, average: Math.round(average * 10) / 10, count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// 4. Submit or update a review (logged-in customer)
router.post("/product/:productId", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId as string;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "التقييم يجب أن يكون من 1 إلى 5 نجوم" });
    }

    const customer = await Customer.findById(req.customerId);
    if (!customer) return res.status(404).json({ message: "الحساب غير موجود" });

    const product = await Product.findById(productId);

    const review = await Review.findOneAndUpdate(
      { productId, customerId: req.customerId },
      {
        rating,
        comment: comment || "",
        customerName: customer.name,
        productName: product?.nameAr || "",
        isFeatured: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recomputeProductRating(productId);

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// --- ADMIN ROUTES ---

// 5. Admin: Get all reviews
router.get("/admin/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("productId", "nameAr images")
        .lean(),
      Review.countDocuments({}),
    ]);

    return res.json({ reviews, total });
  } catch (error) {
    console.error("Admin fetch reviews error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// 6. Admin: Add a new custom review manually
router.post("/admin/add", requireAuth, async (req: Request, res: Response) => {
  try {
    const { customerName, rating, comment, productName } = req.body;
    if (!customerName || !rating) {
      return res.status(400).json({ message: "اسم العميل والتقييم مطلوبان" });
    }

    const review = await Review.create({
      customerName,
      rating: Number(rating),
      comment: comment || "",
      productName: productName || "منتج متجر المهندس",
      isFeatured: true,
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error("Admin add review error:", error);
    return res.status(500).json({ message: "حدث خطأ في إنشاء التقييم" });
  }
});

// 7. Admin: Toggle featured status
router.put("/admin/:reviewId/toggle-featured", requireAuth, async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "التقييم غير موجود" });

    review.isFeatured = !review.isFeatured;
    await review.save();

    return res.json(review);
  } catch (error) {
    console.error("Toggle featured review error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// 8. Admin: Delete review
router.delete("/admin/:reviewId", requireAuth, async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "التقييم غير موجود" });

    const productId = review.productId ? review.productId.toString() : null;
    await review.deleteOne();
    if (productId) await recomputeProductRating(productId);

    return res.json({ message: "تم حذف التقييم بنجاح" });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

export default router;
