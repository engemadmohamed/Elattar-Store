import { Router, Request, Response } from "express";
import { Category } from "../models/Category.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get all categories (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Get category by id (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.json(category);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create category (admin only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, slug, icon, parentId, image } = req.body;

    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 2;
    while (await Category.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = new Category({ name, nameAr, slug: finalSlug, icon, parentId: parentId || null, image });
    await category.save();
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update category (admin only)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.json(category);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete category (admin only)
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id;
    // Also delete subcategories that belong to this category
    await Category.deleteMany({ parentId: categoryId });
    // Then delete the category itself
    await Category.findByIdAndDelete(categoryId);
    return res.json({ message: "Category deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
