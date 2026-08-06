import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  isActive: boolean;
  parentId: mongoose.Types.ObjectId | null;
  image?: string;
  discountPercent?: number;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "📦" },
    isActive: { type: Boolean, default: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    image: { type: String },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
