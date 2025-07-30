import mongoose, { Schema, Model } from "mongoose";

import { ISession } from "./interfaces/sessionInterface";

const sessionSchema: Schema = new Schema<ISession>({
  student_id: { type: Schema.Types.ObjectId, ref: "User" },
  instructor_name: { type: String, required: true },
  instructorId: { type: String },
  instructor_email: { type: String },
  specialization: { type: String },
  hourly_rate: { type: Number, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  status: {
    type: String,
    enum: ["SCHEDULED", "COMPLETED", "CANCELED"],
    default: "SCHEDULED",
  },
  created_at: { type: Date, default: Date.now() },
  updated_at: { type: Date, default: Date.now() },
  connection_status: {
    type: String,
    enum: ["CONNECTED", "DISCONNECTED", "NOT CONNECTED"],
    default: "NOT CONNECTED",
  },
});

const session: Model<ISession> = mongoose.model<ISession>(
  "Session",
  sessionSchema
);
export default session;
