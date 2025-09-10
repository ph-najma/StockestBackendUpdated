import mongoose, { Schema, Model } from "mongoose";

import { ILimit } from "./interfaces/limitInterface";
const LimitSchema: Schema = new Schema<ILimit>({
  maxBuyLimit: {
    type: Number,
    required: true,
    default: 1000,
  },
  maxSellLimit: {
    type: Number,
    required: true,
    default: 500,
  },
  timeframeInHours: {
    type: Number,
    required: true,
    default: 24,
  },
});

const Limit: Model<ILimit> = mongoose.model<ILimit>("Limit", LimitSchema);
export default Limit;
