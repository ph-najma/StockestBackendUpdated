import mongoose, { Schema } from "mongoose";

import { IWatchlist } from "./interfaces/watchlistInterface";

// Define an interface for the Watchlist document

// Define the schema
const watchlistSchema = new Schema<IWatchlist>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stocks: [
    {
      symbol: { type: String },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  name: {
    type: String,
    default: "My Watchlist", // Default name for the watchlist
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model
const Watchlist = mongoose.model<IWatchlist>("Watchlist", watchlistSchema);

export default Watchlist;
