import { IStock } from "../../models/interfaces/stockInterface";
import mongoose, { FilterQuery, UpdateQuery } from "mongoose";
export interface IStockRepository {
  getAllStocks(): Promise<IStock[]>;
  createStock(stockData: Partial<IStock>): Promise<IStock>;
  getStockById(
    stockId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IStock | null>;
  updateStock(
    stockId: string,
    updatedData: Partial<IStock>
  ): Promise<IStock | null>;
  deleteStock(stockId: string): Promise<void>;
  getMarketPrice(symbol: string): Promise<any>;
  getStockData(symbol: string | undefined): Promise<IStock[]>;
  searchStocks(query: Partial<IStock>): Promise<IStock[]>;
}
