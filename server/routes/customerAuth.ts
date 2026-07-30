import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer.js";
import { requireCustomerAuth, CustomerAuthRequest } from "../middleware/auth.js";

const router = Router();

// Sign up
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { name, phone, password, libraryName, libraryLocation } = req.body;
    if (!name || !phone || !password || !libraryName || !libraryLocation) {
      return res.status(400).json({ message: "الرجاء ملء جميع الحقول" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ message: "هذا الرقم مسجل بالفعل" });
    }

    const customer = await Customer.create({
      name,
      phone,
      password,
      libraryName,
      libraryLocation,
      email: `${phone}@almohandes.placeholder`, // Add a unique placeholder email
    });
    const token = jwt.sign({ id: customer._id }, JWT_SECRET, { expiresIn: "30d" });

    return res.status(201).json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        libraryName: customer.libraryName,
        libraryLocation: customer.libraryLocation,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "رقم الهاتف وكلمة المرور مطلوبان" });
    }

    const customer = await Customer.findOne({ phone });
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }

    const token = jwt.sign({ id: customer._id }, JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        libraryName: customer.libraryName,
        libraryLocation: customer.libraryLocation,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// Get current customer
router.get("/me", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.customerId).select("-password");
    if (!customer) return res.status(404).json({ message: "الحساب غير موجود" });
    return res.json(customer);
  } catch (error) {
    console.error("Error fetching current customer:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// Update profile
router.put("/me", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { name, phone, libraryName, libraryLocation } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "الاسم ورقم الهاتف مطلوبان" });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.customerId,
      { name, phone, libraryName, libraryLocation },
      { new: true, runValidators: true }
    ).select("-password");
    if (!customer) return res.status(404).json({ message: "الحساب غير موجود" });
    return res.json(customer);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

export default router;
