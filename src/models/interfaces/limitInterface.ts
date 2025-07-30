import mongoose, { Types, Document } from "mongoose";

export interface ILimit extends Document {
  maxBuyLimit: number;
  maxSellLimit: number;
  timeframeInHours: number;
}
