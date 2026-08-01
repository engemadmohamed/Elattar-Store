import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer.js";
import { Otp } from "../models/Otp.js";
import { requireCustomerAuth, CustomerAuthRequest } from "../middleware/auth.js";
import { sendSmsOtp } from "../lib/sms.js";

const router = Router();

// 1. Send OTP (Server-side real OTP generation, storage & SMS dispatch)
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "رقم الهاتف مطلوب" });
    }

    // Clean phone number format
    const cleanedPhone = phone.trim();

    // Check if phone is already registered
    const existingCustomer = await Customer.findOne({ phone: cleanedPhone });
    if (existingCustomer) {
      return res.status(409).json({ message: "هذا الرقم مسجل بالفعل، يمكنك تسجيل الدخول" });
    }

    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Delete existing unverified OTP for this phone
    await Otp.deleteMany({ phone: cleanedPhone });

    // Save new OTP to database
    await Otp.create({
      phone: cleanedPhone,
      code,
      verified: false,
      expiresAt,
    });

    // Send SMS via Gateway (SMS MISR / Twilio / Dev Console)
    const smsResult = await sendSmsOtp(cleanedPhone, code);

    return res.json({
      success: true,
      message: `تم إرسال رمز التحقق إلى الرقم ${cleanedPhone}`,
      provider: smsResult.provider,
      code: process.env.NODE_ENV === "production" ? undefined : code,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ message: "حدث خطأ أثناء إرسال رمز التحقق" });
  }
});

// 2. Verify OTP Endpoint
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: "رقم الهاتف ورمز التحقق مطلوبان" });
    }

    const cleanedPhone = phone.trim();
    const cleanedCode = code.trim();

    const otpRecord = await Otp.findOne({
      phone: cleanedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "رمز التحقق منتهي الصلاحية أو غير موجود، أعد الإرسال" });
    }

    if (otpRecord.code !== cleanedCode) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح" });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return res.json({
      success: true,
      verified: true,
      message: "تم إثبات ملكية رقم الهاتف بنجاح",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "حدث خطأ أثناء التحقق من الرمز" });
  }
});

// 3. Sign up (with server-side OTP validation)
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { name, phone, password, libraryName, libraryLocation, code } = req.body;

    if (!name || !phone || !password || !libraryName || !libraryLocation) {
      return res.status(400).json({ message: "الرجاء ملء جميع الحقول المطلوبة" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const cleanedPhone = phone.trim();

    // Check if phone already registered
    const existingPhone = await Customer.findOne({ phone: cleanedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: "هذا الرقم مسجل بالفعل" });
    }

    // Server-side strict OTP validation
    if (!code) {
      return res.status(400).json({ message: "يرجى إدخال رمز التحقق من الهاتف" });
    }

    const otpRecord = await Otp.findOne({
      phone: cleanedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "انتهت صلاحية كود التحقق. يرجى طلب كود جديد" });
    }

    if (otpRecord.code !== code.trim() && !otpRecord.verified) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح" });
    }

    // Create Customer
    const customer = await Customer.create({
      name,
      phone: cleanedPhone,
      password,
      libraryName,
      libraryLocation,
      email: `${cleanedPhone}@almohandes.store`,
    });

    // Remove used OTP
    await Otp.deleteMany({ phone: cleanedPhone });

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
    console.error("Signup error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم أثناء إنشاء الحساب" });
  }
});

// 4. Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "رقم الهاتف وكلمة المرور مطلوبان" });
    }

    const cleanedPhone = phone.trim();
    const customer = await Customer.findOne({ phone: cleanedPhone });
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
    console.error("Login error:", error);
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// 5. Get current customer
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

// 6. Update profile
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
