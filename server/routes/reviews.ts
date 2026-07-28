import { Router, Request, Response } from "express";
import { Review } from "../models/Review.js";
import { Customer } from "../models/Customer.js";
import { Product } from "../models/Product.js";
import { requireAuth, requireCustomerAuth, CustomerAuthRequest } from "../middleware/auth.js";

const router = Router();

async function recomputeProductRating(productId: string) {
  const allReviews = await Review.find({ productId });
  const ratingCount = allReviews.length;
  const ratingAverage = ratingCount
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
    : 0;
  await Product.findByIdAndUpdate(productId, { ratingAverage, ratingCount });
}

// Get all reviews for a product (public) + rating summary
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ helpfulCount: -1, createdAt: -1 })
      .lean();
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    return res.json({ reviews, average: Math.round(average * 10) / 10, count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Submit or update a review (logged-in customers only)
router.post("/product/:productId", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId as string;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "التقييم يجب أن يكون من 1 إلى 5 نجوم" });
    }

    const customer = await Customer.findById(req.customerId);
    if (!customer) return res.status(404).json({ message: "الحساب غير موجود" });

    const review = await Review.findOneAndUpdate(
      { productId, customerId: req.customerId },
      { rating, comment: comment || "", customerName: customer.name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recomputeProductRating(productId);

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Mark a review as helpful (logged-in customers only)
router.post("/:reviewId/helpful", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "التقييم غير موجود" });
    }

    // Customers can't mark their own reviews as helpful
    if (review.customerId.toString() === req.customerId) {
      return res.status(400).json({ message: "لا يمكنك تقييم مراجعتك الخاصة" });
    }

    const customerId = req.customerId as string;
    const alreadyVoted = review.helpfulVotes.some((id) => id.toString() === customerId);

    if (alreadyVoted) {
      // Remove vote
      review.helpfulVotes = review.helpfulVotes.filter((id) => id.toString() !== customerId);
    } else {
      // Add vote
      review.helpfulVotes.push(customerId as any);
    }

    review.helpfulCount = review.helpfulVotes.length;
    await review.save();

    return res.json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete the logged-in customer's own review
router.delete("/:reviewId", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const reviewId = req.params.reviewId as string;
    const review = await Review.findOne({ _id: reviewId, customerId: req.customerId });
    if (!review) return res.status(404).json({ message: "التقييم غير موجود" });

    const productId = review.productId.toString();
    await review.deleteOne();
    await recomputeProductRating(productId);

    return res.json({ message: "تم حذف التقييم" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// --- Admin Routes ---

// Admin: Get all reviews
router.get("/admin/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("productId", "nameAr images") // Populate product info
        .lean(),
      Review.countDocuments({}),
    ]);

    return res.json({ reviews, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: Delete any review
router.delete("/admin/:reviewId", requireAuth, async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "التقييم غير موجود" });

    const productId = review.productId.toString();
    await review.deleteOne();
    await recomputeProductRating(productId);

    return res.json({ message: "تم حذف التقييم" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: Update any review (e.g., to fix typos or remove inappropriate content)
router.put("/admin/:reviewId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "التقييم غير موجود" });

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await recomputeProductRating(review.productId.toString());

    return res.json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
