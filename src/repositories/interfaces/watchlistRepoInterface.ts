import { IWatchlist } from "../../models/interfaces/watchlistInterface";
export interface IWatchlistRepository {
  getByUserId(userId: string | undefined): Promise<IWatchlist | null>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockId: string
  ): Promise<IWatchlist>;
  removeStockFromWatchlist(
    userId: string | undefined,
    stockSymbol: string
  ): Promise<IWatchlist | null>;
}
