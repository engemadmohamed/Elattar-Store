import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get current admin
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    return res.json(admin);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
