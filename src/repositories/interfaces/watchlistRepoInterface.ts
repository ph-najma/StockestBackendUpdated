import { IWatchlist } from "../../models/interfaces/watchlistInterface";
export interface IWatchlistRepository {
  getByUserId(userId: string | undefined): Promise<any>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockId: string
  ): Promise<IWatchlist>;
}
