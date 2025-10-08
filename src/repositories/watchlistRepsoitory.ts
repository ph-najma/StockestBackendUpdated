import { IWatchlist } from "../models/interfaces/watchlistInterface";
import { IWatchlistRepository } from "./interfaces/watchlistRepoInterface";
import { Model } from "mongoose";

export class WatchlistRepostory implements IWatchlistRepository {
  constructor(private watchlistModel: Model<IWatchlist>) {}
  async getByUserId(userId: string | undefined): Promise<IWatchlist | null> {
    if (!userId) {
      console.error("User ID is undefined");
      return null;
    }

    // Fetch the watchlist
    const watchlist = await this.watchlistModel
      .findOne({ user: userId })
      .populate("stocks") // 👈 populates stock details from Stock model
      .lean();
    if (!watchlist) {
      return null;
    }
    return watchlist;
  }

  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockSymbol: string
  ): Promise<IWatchlist> {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    let watchlist = await this.watchlistModel.findOne({ user: userId });

    if (watchlist) {
      const stockExists = watchlist.stocks.some(
        (s: any) => s.symbol.toString() === stockSymbol.toString()
      );

      if (!stockExists) {
        watchlist.stocks.push({ symbol: stockSymbol, addedAt: new Date() });
        await watchlist.save();
      }
    } else {
      watchlist = new this.watchlistModel({
        user: userId,
        stocks: [{ symbol: stockSymbol, addedAt: new Date() }],
      });
      await watchlist.save();
    }

    return watchlist;
  }
  async removeStockFromWatchlist(
    userId: string | undefined,
    stockSymbol: string
  ): Promise<IWatchlist | null> {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    // Find user's watchlist
    const watchlist = await this.watchlistModel.findOne({ user: userId });
    if (!watchlist) {
      throw new Error("Watchlist not found.");
    }

    console.log("Watchlist stocks before removal:", watchlist.stocks);
    console.log("Trying to remove symbol:", stockSymbol);

    // ✅ FIX: use `symbol`, not `stock`
    const updatedStocks = watchlist.stocks.filter(
      (s: any) => s.symbol !== stockSymbol
    );

    if (updatedStocks.length === watchlist.stocks.length) {
      throw new Error(`Stock ${stockSymbol} not found in watchlist.`);
    }

    watchlist.stocks = updatedStocks;
    await watchlist.save();

    return watchlist;
  }
}
