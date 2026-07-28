import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  categoryId: mongoose.Types.ObjectId;
  sku: string;
  barcode?: string;
  qrCode?: string;
  brand?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  tags: string[];
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    description: { type: String, default: "" },
    descriptionAr: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    qrCode: { type: String },
    brand: { type: String },
    weight: { type: Number },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
    },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", nameAr: "text", description: "text" });
ProductSchema.index({ isActive: 1 });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
