import mongoose, { Types, Document } from "mongoose";
import { IStock } from "./stockInterface";
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  stock: IStock["_id"] | string | mongoose.Types.ObjectId;
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP";
  quantity: number;
  price: number;
  stopPrice?: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  completedAt?: Date;
  isIntraday: Boolean;
  orderId?: string;
}
