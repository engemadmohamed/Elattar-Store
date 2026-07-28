import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

CustomerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

CustomerSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
