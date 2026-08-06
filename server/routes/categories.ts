import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create category (admin only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, slug, icon, parentId, image } = req.body;

    // Clean parentId to prevent ObjectId cast errors on empty strings
    const cleanParentId = parentId && mongoose.Types.ObjectId.isValid(parentId) ? parentId : null;

    // Ensure slug is unique
    let finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
    let counter = 2;
    while (await Category.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = new Category({
      name,
      nameAr,
      slug: finalSlug,
      icon: icon || "📦",
      parentId: cleanParentId,
      image,
    });
    await category.save();
    return res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Server error creating category" });
  }
});

// Update category (admin only)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, slug, icon, parentId, image, isActive } = req.body;
    
    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (nameAr !== undefined) updateFields.nameAr = nameAr;
    if (slug !== undefined) updateFields.slug = slug;
    if (icon !== undefined) updateFields.icon = icon;
    if (image !== undefined) updateFields.image = image;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (parentId !== undefined) {
      updateFields.parentId = parentId && mongoose.Types.ObjectId.isValid(parentId) ? parentId : null;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error updating category" });
  }
});

// Delete category (admin only)
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.id);

    // To recursively delete, we need to find all descendants first.
    const allCategories = await Category.find().lean();

    const idsToDelete: string[] = [categoryId];
    const queue: string[] = [categoryId];
    const visited = new Set<string>([categoryId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = allCategories.filter((c) => c.parentId?.toString() === currentId);
      for (const child of children) {
        const childIdStr = child._id.toString();
        if (!visited.has(childIdStr)) {
          visited.add(childIdStr);
          idsToDelete.push(childIdStr);
          queue.push(childIdStr);
        }
      }
    }

    // Delete all products within these categories
    await Product.deleteMany({ categoryId: { $in: idsToDelete } });

    await Category.deleteMany({ _id: { $in: idsToDelete } });
    return res.json({ message: "تم حذف الفئة والفئات الفرعية والمنتجات بنجاح" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Apply category discount to all products under this category (admin only)
router.post("/:id/apply-discount", requireAuth, async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.id);
    const { discountPercent = 0 } = req.body;

    const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Find category and subcategories if any
    const allCategories = await Category.find().lean();
    const categoryIds: string[] = [categoryId];
    const queue: string[] = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = allCategories.filter((c) => c.parentId?.toString() === currentId);
      for (const child of children) {
        const childIdStr = child._id.toString();
        if (!categoryIds.includes(childIdStr)) {
          categoryIds.push(childIdStr);
          queue.push(childIdStr);
        }
      }
    }

    // Update discountPercent for parent category and all subcategories under it
    await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: { discountPercent: percent } }
    );

    const products = await Product.find({ categoryId: { $in: categoryIds } });
    let updatedCount = 0;

    for (const product of products) {
      if (percent > 0) {
        const calculated = Math.round(product.price * (1 - percent / 100));
        product.salePrice = calculated;
      } else {
        product.salePrice = undefined;
      }
      await product.save();
      updatedCount++;
    }

    return res.json({
      message: percent > 0 ? `تم تطبيق خصم ${percent}% على ${updatedCount} منتج` : `تم إزالة الخصم عن ${updatedCount} منتج`,
      category,
      updatedCount,
    });
  } catch (error) {
    console.error("Error applying category discount:", error);
    return res.status(500).json({ message: "Server error applying discount" });
  }
});

export default router;
