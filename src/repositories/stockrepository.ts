import { IStock } from "../models/interfaces/stockInterface";
import { Model, ObjectId, Types } from "mongoose";
import { IStockRepository } from "./interfaces/stockRepoInterface";
export class StockRepository implements IStockRepository {
  constructor(private stockModel: Model<IStock>) {}
  async getAllStocks(): Promise<IStock[]> {
    return this.stockModel.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$symbol",
          latest: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latest" } },
    ]);
  }

  // Create a new stock
  async createStock(stockData: Partial<IStock>): Promise<IStock> {
    return await this.stockModel.create(stockData);
  }
  // Fetch a single stock by ID
  async getStockById(stockId: string | Types.ObjectId): Promise<IStock | null> {
    return this.stockModel.findById(stockId).exec();
  }

  async updateStock(
    stockId: string | ObjectId,
    updatedData: Partial<IStock>
  ): Promise<IStock | null> {
    return this.stockModel
      .findByIdAndUpdate(stockId, updatedData, { new: true })
      .exec();
  }

  // Delete a stock by ID
  async deleteStock(stockId: string): Promise<void> {
    await this.stockModel.findByIdAndDelete(stockId).exec();
  }
  async getMarketPrice(symbol: string): Promise<number | null> {
    const stockData = await this.stockModel
      .findOne({ symbol })
      .sort({ timestamp: -1 })
      .exec();
    return stockData ? stockData.price : null;
  }
  async getStockData(symbol: string | undefined): Promise<IStock[]> {
    return await this.stockModel
      .find({ symbol })
      .sort({ timestamp: 1 })
      .limit(10)
      .exec();
  }
  async searchStocks(query: Partial<IStock>): Promise<IStock[]> {
    const filters: any = {};
    if (query.symbol) filters.symbol = { $regex: query.symbol, $options: "i" };
    if (query.timestamp) filters.timestamp = query.timestamp;
    if (query.price) filters.price = query.price;
    if (query.change) filters.change = query.change;

    return this.stockModel.aggregate([
      { $match: filters },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$symbol", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },
    ]);
  }
  async save(stock: any) {
    return stock.save();
  }
  async findBySymbol(symbol: string): Promise<IStock | null> {
    return await this.stockModel.findOne({ symbol }).lean();
  }
}
