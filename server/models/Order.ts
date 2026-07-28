import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingInfo {
  company: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  cost: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  governorate: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shipping: IShippingInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  company: { type: String, required: true },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  cost: { type: Number, required: true, default: 0 },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  governorate: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: false, default: "" },
    customerPhone: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cash_on_delivery" },
    shipping: ShippingInfoSchema,
    notes: { type: String },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
