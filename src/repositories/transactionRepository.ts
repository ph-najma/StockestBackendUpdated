import transactionModel from "../models/transactionModel";
import { ITradeDiary } from "../interfaces/Interfaces";
import { ITransaction } from "../models/interfaces/transactionInterface";
import { IStock } from "../models/interfaces/stockInterface";
import { IOrder } from "../models/interfaces/orderInterface";
import { ITransactionRepository } from "./interfaces/transactionRepoInterface";
export class transactionRepository implements ITransactionRepository {
  async getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<ITransaction[]> {
    const transactions = await transactionModel
      .find({
        $or: [{ buyer: userId }, { seller: userId }],
      })
      .skip(skip)
      .limit(limit)
      .populate("buyer")
      .populate("seller")
      .populate("buyOrder")
      .populate("sellOrder")
      .populate("stock");

    return transactions;
  }
  async getAllTransactions(): Promise<ITransaction[]> {
    const transactions = await transactionModel
      .find()
      .populate("buyer", "name")
      .populate("seller", "name")
      .populate("stock", "symbol")
      .exec();

    return transactions;
  }
  async getFeeCollectionSummary(): Promise<number> {
    try {
      const totalFees = await transactionModel.aggregate([
        {
          $match: {
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: null,
            totalFees: { $sum: "$fees" },
          },
        },
      ]);

      return totalFees[0]?.totalFees || 0;
    } catch (error) {
      console.error("Error fetching fee collection summary: ", error);
      throw error;
    }
  }
  async getTradeDiary(userId: string | undefined): Promise<ITradeDiary> {
    try {
      const skip = 0;
      const limit = 0;
      const transactions = await this.getTransactions(userId, skip, limit); // Get the user's transactions

      let totalTrades = 0;
      let totalPnl = 0;
      let totalCharges = 0;
      let totalBrokerage = 0;
      let tradeDetails: any[] = [];

      // Iterate through the transactions to calculate PnL, fees, and other metrics
      transactions.forEach((transaction: ITransaction) => {
        const pnl =
          transaction.type === "BUY"
            ? transaction.price * transaction.quantity
            : 0;
        const charges = transaction.fees;
        const brokerage = charges * 0.1;

        totalTrades++;

        totalPnl += pnl;
        totalCharges += charges;
        totalBrokerage += brokerage;

        const date = transaction.createdAt.toISOString().split("T")[0]; // Get the date in YYYY-MM-DD format

        // Check if trade already exists for the day
        let dailyTrade = tradeDetails.find((trade) => trade.date === date);
        const symbol = (transaction.stock as IStock).symbol ?? "Unknown";

        const buyOrderPrice = isIOrder(transaction.buyOrder)
          ? transaction.buyOrder.price
          : 0;
        const sellOrderPrice = isIOrder(transaction.sellOrder)
          ? transaction.sellOrder.price
          : 0;
        if (!dailyTrade) {
          dailyTrade = {
            date,
            trades: 1,
            overallPL: pnl,
            netPL: pnl - charges - brokerage,
            status: transaction.status,
            details: [
              {
                time: transaction.createdAt.toLocaleTimeString(),
                type: transaction.type,
                symbol: symbol,
                quantity: transaction.quantity,
                entry: buyOrderPrice,
                exit: sellOrderPrice,
                pnl: pnl,
                notes: "Example trade note",
              },
            ],
          };
          tradeDetails.push(dailyTrade);
        } else {
          dailyTrade.trades++;
          dailyTrade.overallPL += pnl;
          dailyTrade.netPL += pnl - charges - brokerage;
          dailyTrade.details.push({
            time: transaction.createdAt.toLocaleTimeString(),
            type: transaction.type,
            symbol: symbol,
            quantity: transaction.quantity,
            entry: buyOrderPrice,
            exit: sellOrderPrice,
            pnl: pnl,
            notes: "Example trade note",
          });
        }
      });

      // Calculate Win Rate, Average Win, Average Loss
      const winTrades = transactions.filter((transaction: ITransaction) => {
        const buyOrderPrice = isIOrder(transaction.buyOrder)
          ? transaction.buyOrder.price
          : 0;
        const sellOrderPrice = isIOrder(transaction.sellOrder)
          ? transaction.sellOrder.price
          : 0;
        transaction.type === "BUY" && sellOrderPrice > buyOrderPrice;
      }).length;
      const lossTrades = totalTrades - winTrades;
      const winRate = (winTrades / totalTrades) * 100;
      const averageWin = winTrades ? totalPnl / winTrades : 0;
      const averageLoss = lossTrades ? totalPnl / lossTrades : 0;

      // Final result object to return
      const finalResult = {
        winRate,
        averageWin,
        averageLoss,
        overallPL: totalPnl,
        netPL: totalPnl - totalCharges - totalBrokerage,
        totalTrades,
        charges: totalCharges,
        brokerage: totalBrokerage,
        trades: tradeDetails,
      };

      return finalResult;
    } catch (error) {
      console.error("Error generating trade diary:", error);
      throw error;
    }
  }
}
function isIOrder(order: any): order is IOrder {
  return order && typeof order.price === "number";
}
