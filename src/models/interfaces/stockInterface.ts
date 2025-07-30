import mongoose, { Types, Document } from "mongoose";

export interface IStock extends Document {
  _id: Types.ObjectId;
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number;
  change: number;
  changePercent: string;
  latestTradingDay: string;
  adjustedVolume: number;
}
