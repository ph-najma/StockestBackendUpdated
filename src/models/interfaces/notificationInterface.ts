import mongoose, { Types, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Schema.Types.ObjectId;
  message: string;
  type: "TRADE_SUCCESS" | "TRADE_FAILURE";
  isRead: boolean;
  createdAt: Date;
}
