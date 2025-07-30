import mongoose, { Schema } from "mongoose";

import { ITransaction } from "./interfaces/transactionInterface";
const transactionSchema = new Schema<ITransaction>({
  buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  buyOrder: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  sellOrder: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  stock: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
  type: { type: String, enum: ["BUY", "SELL"], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  fees: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
  paymentMethod: {
    type: String,
    enum: ["PAYPAL", "CREDIT_CARD", "BANK_TRANSFER"],
    default: "PAYPAL",
  },
  paymentReference: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
