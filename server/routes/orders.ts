import { Router, Request, Response } from "express";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { requireAuth, requireCustomerAuth, attachCustomerIfPresent, CustomerAuthRequest } from "../middleware/auth.js";

const router = Router();

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `EL-${year}${month}-${random}`;
}

// Create order (public - customer checkout, optionally linked to a logged-in customer)
router.post("/", attachCustomerIfPresent, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { customerName, customerEmail, customerPhone, items, shipping, paymentMethod, notes, customerLibraryName, customerLibraryLocation, transferScreenshotUrl } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }

    // Validate and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `الكمية غير متوفرة لمنتج: ${product.nameAr}` });
      }

      const price = product.salePrice || product.price;
      subtotal += price * item.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        nameAr: product.nameAr,
        price,
        quantity: item.quantity,
        image: product.images[0],
        color: item.color || undefined,
      });

      // Decrement stock, increment sold count (used for the Best Sellers section)
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity, soldCount: item.quantity } });
    }

    const shippingCost = shipping?.cost || 0;
    const total = subtotal + shippingCost;

    const order = new Order({
      orderNumber: generateOrderNumber(),
      customerId: req.customerId || undefined,
      customerName,
      customerEmail,
      customerPhone,
      customerLibraryName,
      customerLibraryLocation,
      items: orderItems,
      subtotal,
      shippingCost,
      total,
      paymentMethod: paymentMethod || "cash_on_delivery",
      transferScreenshotUrl,
      shipping,
      notes,
    });

    await order.save();
    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get logged-in customer's own orders
router.get("/my-orders", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ customerId: req.customerId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all orders (admin only)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    return res.json({ orders, total });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: customers list with order totals (for the invoices/customers view)
router.get("/customers/summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const summary = await Order.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          customerPhone: { $last: "$customerPhone" },
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);
    return res.json(summary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: all orders (invoices) for one customer, by phone
router.get("/customers/:phone", requireAuth, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ customerPhone: req.params.phone }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Customer cancels their own order (only while it hasn't shipped yet)
router.put("/my-orders/:id/cancel", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.customerId });
    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });

    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "لا يمكن إلغاء هذا الطلب حالياً" });
    }

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

  order.status = "cancelled";
    (order as any).cancelledBy = "customer";
    await order.save();
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Customer deletes their own order from history (only delivered/cancelled)
router.delete("/my-orders/:id", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.customerId });
    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });

    if (!["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "لا يمكن حذف طلب لم يكتمل أو لم يُلغَ بعد" });
    }

    await Order.findByIdAndDelete(order._id);
    return res.json({ message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get order by ID (admin only)
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update order status (admin only)
router.put("/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, trackingNumber } = req.body;
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (trackingNumber) update["shipping.trackingNumber"] = trackingNumber;

    if (status === "cancelled") {
      update.cancelledBy = "admin";
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: Mark an order as refunded (admin only)
router.put("/:id/refund", requireAuth, async (req: Request, res: Response) => {
  try {
    const { refundScreenshotUrl } = req.body;
    if (!refundScreenshotUrl) {
      return res.status(400).json({ message: "صورة إثبات التحويل مطلوبة" });
    }
    const update = { refundStatus: "refunded", refundScreenshotUrl };
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (error) {
    console.error("Error refunding order:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
