import mongoose, { Schema } from "mongoose";
import { INotification } from "./interfaces/notificationInterface";
const notificationSchema = new Schema<INotification>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["TRADE_SUCCESS", "TRADE_FAILURE"],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Notification", notificationSchema);
