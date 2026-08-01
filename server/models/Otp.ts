import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  code: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete on expiration
  },
  { timestamps: true }
);

export const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
