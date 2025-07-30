import mongoose, { Schema } from "mongoose";

import { IStock } from "./interfaces/stockInterface";

const stockSchema: Schema = new Schema({
  symbol: { type: String, required: true },
  timestamp: { type: Date, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  price: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: String, required: true },
  latestTradingDay: { type: String, required: true },
  adjustedVolume: { type: Number, required: true },
});

const Stock = mongoose.model<IStock>("Stock", stockSchema);

export default Stock;
