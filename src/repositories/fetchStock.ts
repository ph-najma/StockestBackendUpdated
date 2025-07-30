import axios from "axios";
import Stock from "../models/stockModel";
import { client } from "../config/redis";
import { IStock } from "../models/interfaces/stockInterface";

export class fetchStockRepository {
  private cacheExpiry = 60 * 5;
  async fetchStockData(symbols: string[]): Promise<void> {
    try {
      for (const symbol of symbols) {
        const cachedData = await client.get(symbol);
        if (cachedData) {
          const stockData = JSON.parse(cachedData);
          continue;
        }

        // Fetch stock data from Alpha Vantage API
        const response = await axios.get("https://www.alphavantage.co/query", {
          params: {
            function: "GLOBAL_QUOTE",
            symbol,
            apikey: process.env.ALPHA_VANTAGE_API_KEY,
          },
        });

        const globalQuote = response.data["Global Quote"];
        if (!globalQuote) {
          console.error("Error fetching data:", response.data);
          return;
        }

        // Extract stock data from API response
        const fetchedVolume = parseInt(globalQuote["06. volume"]);

        const existingStock = await Stock.findOne({ symbol });

        // If stock exists, update it, else create a new stock entry
        if (existingStock) {
          // Update the stock data and adjust the volume
          existingStock.timestamp = new Date();
          existingStock.latestTradingDay =
            globalQuote["07. latest trading day"];
          existingStock.price = parseFloat(globalQuote["05. price"]);
          existingStock.change = parseFloat(globalQuote["09. change"]);
          existingStock.changePercent = globalQuote["10. change percent"];
          existingStock.open = parseFloat(globalQuote["02. open"]);
          existingStock.high = parseFloat(globalQuote["03. high"]);
          existingStock.low = parseFloat(globalQuote["04. low"]);
          existingStock.close = parseFloat(globalQuote["08. previous close"]);
          existingStock.volume = fetchedVolume; // Market volume from API

          // Add fetched volume to adjusted volume (appending new volume data)
          existingStock.adjustedVolume = existingStock.adjustedVolume || 0;
          // Add the new volume

          await existingStock.save();
        } else {
          // If stock doesn't exist, create a new stock entry
          const stockData: Partial<IStock> = {
            symbol: globalQuote["01. symbol"],
            timestamp: new Date(),
            latestTradingDay: globalQuote["07. latest trading day"],
            price: parseFloat(globalQuote["05. price"]),
            change: parseFloat(globalQuote["09. change"]),
            changePercent: globalQuote["10. change percent"],
            open: parseFloat(globalQuote["02. open"]),
            high: parseFloat(globalQuote["03. high"]),
            low: parseFloat(globalQuote["04. low"]),
            close: parseFloat(globalQuote["08. previous close"]),
            volume: fetchedVolume,
            adjustedVolume: fetchedVolume, // Initialize adjustedVolume with API volume
          };

          await client.set(symbol, JSON.stringify(stockData), {
            EX: this.cacheExpiry, // Set expiry time
          });

          // Check if the stock already exists in the database
          const existingStock = await Stock.findOne({ symbol });
          if (existingStock) {
            // Update the stock in the database
            Object.assign(existingStock, stockData);
            console.log(existingStock, stockData);
            await existingStock.save();
          } else {
            // Create a new stock entry in the database
            const stock = new Stock(stockData);
            await stock.save();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }
}
