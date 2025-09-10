import mongoose, { Types, Document } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  message: string;
  type: "TRADE_SUCCESS" | "TRADE_FAILURE";
  isRead: boolean;
  createdAt: Date;
}
