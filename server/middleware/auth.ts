import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: string;
  adminRole?: string;
}

export interface CustomerAuthRequest extends Request {
  customerId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: "Server misconfigured: JWT_SECRET not set" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: string };
    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireCustomerAuth(req: CustomerAuthRequest, res: Response, next: NextFunction) {
  const token = req.headers["x-customer-token"] as string | undefined;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: "Server misconfigured: JWT_SECRET not set" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    req.customerId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Attaches customerId if a valid customer token is present, but never blocks
// the request — checkout works for logged-in customers and guests alike.
export function attachCustomerIfPresent(req: CustomerAuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers["x-customer-token"] as string | undefined;
  const jwtSecret = process.env.JWT_SECRET;
  if (token && jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string };
      req.customerId = decoded.id;
    } catch {
      // ignore invalid/expired token for optional attachment
    }
  }
  next();
}
