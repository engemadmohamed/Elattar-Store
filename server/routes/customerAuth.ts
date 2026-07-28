import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer.js";
import { requireCustomerAuth, CustomerAuthRequest } from "../middleware/auth.js";

const router = Router();

// Sign up
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "الرجاء ملء جميع الحقول" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "هذا البريد الإلكتروني مسجل بالفعل" });
    }

    const customer = await Customer.create({ name, email, phone, password });
    const token = jwt.sign({ id: customer._id }, JWT_SECRET, { expiresIn: "30d" });

    return res.status(201).json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    const token = jwt.sign({ id: customer._id }, JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
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
  } catch {
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// Update profile (name/phone only — email stays fixed to avoid login mixups)
router.put("/me", requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "الاسم ورقم الهاتف مطلوبان" });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.customerId,
      { name, phone },
      { new: true, runValidators: true }
    ).select("-password");
    if (!customer) return res.status(404).json({ message: "الحساب غير موجود" });
    return res.json(customer);
  } catch {
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

export default router;
