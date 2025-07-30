import Stock from "../models/stockModel";
import { IStock } from "../models/interfaces/stockInterface";
import { Model } from "mongoose";
import mongoose from "mongoose";
import { IStockRepository } from "./interfaces/stockRepoInterface";
export class StockRepository implements IStockRepository {
  private model: Model<IStock>;
  constructor() {
    this.model = Stock;
  }
  async getAllStocks() {
    const stocks = await Stock.aggregate([
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$symbol",
          originalId: { $first: "$_id" },
          symbol: { $first: "$symbol" },
          timestamp: { $first: "$timestamp" },
          open: { $first: "$open" },
          high: { $first: "$high" },
          low: { $first: "$low" },
          close: { $first: "$close" },
          volume: { $first: "$volume" },
          price: { $first: "$price" },
          change: { $first: "$change" },
          changePercent: { $first: "$changePercent" },
          latestTradingDay: { $first: "$latestTradingDay" },
        },
      },
      {
        $project: {
          _id: 0,
          originalId: 1,
          symbol: 1,
          timestamp: 1,
          open: 1,
          high: 1,
          low: 1,
          close: 1,
          volume: 1,
          price: 1,
          change: 1,
          changePercent: 1,
          latestTradingDay: 1,
        },
      },
    ]);

    return stocks;
  }

  // Create a new stock
  async createStock(stockData: Partial<IStock>): Promise<IStock> {
    return await this.model.create(stockData);
  }
  // Fetch a single stock by ID
  async getStockById(
    stockId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IStock | null> {
    const stock = await this.model.findById(stockId);

    return stock;
  }
  // Update a stock by ID
  async updateStock(
    stockId: string,
    updatedData: Partial<IStock>
  ): Promise<IStock | null> {
    return await this.model.findByIdAndUpdate(stockId, updatedData, {
      new: true,
    });
  }

  // Delete a stock by ID
  async deleteStock(stockId: string): Promise<void> {
    await this.model.findByIdAndDelete(stockId);
  }
  async getMarketPrice(symbol: string): Promise<any> {
    const stockData = await this.model
      .findOne({ symbol })
      .select({ timeStamp: -1 })
      .exec();
    return stockData ? stockData.price : null;
  }
  async getStockData(symbol: string | undefined): Promise<IStock[]> {
    const stockData = await this.model
      .find({ symbol })
      .sort({ timestamp: 1 })
      .limit(10);
    console.log(stockData);
    return stockData;
  }
  async searchStocks(query: Partial<IStock>): Promise<IStock[]> {
    const filters: any = {};

    // Add filters based on the query object
    if (query.symbol) {
      filters.symbol = { $regex: query.symbol, $options: "i" };
    }
    if (query.timestamp) {
      filters.timestamp = query.timestamp;
    }
    if (query.price) {
      filters.price = query.price;
    }
    if (query.change) {
      filters.change = query.change;
    }

    const stocks = await this.model.aggregate([
      { $match: filters },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$symbol",
          latestStock: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestStock" },
      },
    ]);

    return stocks;
  }
}
