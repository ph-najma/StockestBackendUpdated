import Watchlist from "../models/watchlistModel";
import { IWatchlist } from "../models/interfaces/watchlistInterface";
import Stock from "../models/stockModel";
import { IWatchlistRepository } from "./interfaces/watchlistRepoInterface";
export class watchlistRepostory implements IWatchlistRepository {
  async getByUserId(userId: string | undefined): Promise<any> {
    if (!userId) {
      console.error("User ID is undefined");
      return null;
    }

    // Fetch the watchlist
    const watchlist = await Watchlist.findOne({ user: userId });
    if (!watchlist) {
      return null;
    }

    const uniqueStockSymbols = [
      ...new Set(watchlist.stocks.map((stock: any) => stock.symbol)),
    ];
    const stockDataPromises = uniqueStockSymbols.map((symbol) =>
      Stock.findOne({ symbol })
        .sort({ timestamp: -1 })
        .select("symbol price change volume timestamp")
        .lean()
    );

    const stockData = await Promise.all(stockDataPromises);

    const enrichedWatchlist = {
      ...watchlist.toObject(),
      stocks: stockData.filter((data: any) => data),
    };

    return enrichedWatchlist;
  }

  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockSymbol: string
  ): Promise<IWatchlist> {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    let watchlist = await Watchlist.findOne({ user: userId });

    if (watchlist) {
      const stockExists = watchlist.stocks.some(
        (stock: any) => stock.symbol === stockSymbol
      );

      if (!stockExists) {
        watchlist.stocks.push({ symbol: stockSymbol, addedAt: new Date() });
        await watchlist.save();
      }
    } else {
      watchlist = new Watchlist({
        user: userId,
        stocks: [{ symbol: stockSymbol, addedAt: new Date() }],
      });
      await watchlist.save();
    }

    return watchlist;
  }
}
