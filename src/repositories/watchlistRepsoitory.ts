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
        (stock: any) => stock.symbol === stockSymbol
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
}
