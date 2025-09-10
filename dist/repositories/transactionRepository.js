"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
class TransactionRepository {
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }
    getTransactions(userId, skip, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.transactionModel
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
        });
    }
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.transactionModel
                .find()
                .populate("buyer", "name")
                .populate("seller", "name")
                .populate("stock", "symbol")
                .exec();
            return transactions;
        });
    }
    getFeeCollectionSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const totalFees = yield this.transactionModel.aggregate([
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
                return ((_a = totalFees[0]) === null || _a === void 0 ? void 0 : _a.totalFees) || 0;
            }
            catch (error) {
                console.error("Error fetching fee collection summary: ", error);
                throw error;
            }
        });
    }
    // async getTradeDiary(userId: string | undefined): Promise<ITradeDiary> {
    //   try {
    //     const skip = 0;
    //     const limit = 0;
    //     const transactions = await this.getTransactions(userId, skip, limit); // Get the user's transactions
    //     let totalTrades = 0;
    //     let totalPnl = 0;
    //     let totalCharges = 0;
    //     let totalBrokerage = 0;
    //     let tradeDetails: any[] = [];
    // Iterate through the transactions to calculate PnL, fees, and other metrics
    // transactions.forEach((transaction: ITransaction) => {
    //   const pnl =
    //     transaction.type === "BUY"
    //       ? transaction.price * transaction.quantity
    //       : 0;
    //   const charges = transaction.fees;
    //   const brokerage = charges * 0.1;
    //   totalTrades++;
    //   totalPnl += pnl;
    //   totalCharges += charges;
    //   totalBrokerage += brokerage;
    //   const date = transaction.createdAt.toISOString().split("T")[0]; // Get the date in YYYY-MM-DD format
    // Check if trade already exists for the day
    //         let dailyTrade = tradeDetails.find((trade) => trade.date === date);
    //         const symbol = (transaction.stock as IStock).symbol ?? "Unknown";
    //         const buyOrderPrice = isIOrder(transaction.buyOrder)
    //           ? transaction.buyOrder.price
    //           : 0;
    //         const sellOrderPrice = isIOrder(transaction.sellOrder)
    //           ? transaction.sellOrder.price
    //           : 0;
    //         if (!dailyTrade) {
    //           dailyTrade = {
    //             date,
    //             trades: 1,
    //             overallPL: pnl,
    //             netPL: pnl - charges - brokerage,
    //             status: transaction.status,
    //             details: [
    //               {
    //                 time: transaction.createdAt.toLocaleTimeString(),
    //                 type: transaction.type,
    //                 symbol: symbol,
    //                 quantity: transaction.quantity,
    //                 entry: buyOrderPrice,
    //                 exit: sellOrderPrice,
    //                 pnl: pnl,
    //                 notes: "Example trade note",
    //               },
    //             ],
    //           };
    //           tradeDetails.push(dailyTrade);
    //         } else {
    //           dailyTrade.trades++;
    //           dailyTrade.overallPL += pnl;
    //           dailyTrade.netPL += pnl - charges - brokerage;
    //           dailyTrade.details.push({
    //             time: transaction.createdAt.toLocaleTimeString(),
    //             type: transaction.type,
    //             symbol: symbol,
    //             quantity: transaction.quantity,
    //             entry: buyOrderPrice,
    //             exit: sellOrderPrice,
    //             pnl: pnl,
    //             notes: "Example trade note",
    //           });
    //         }
    //       });
    //       // Calculate Win Rate, Average Win, Average Loss
    //       const winTrades = transactions.filter((transaction: ITransaction) => {
    //         const buyOrderPrice = isIOrder(transaction.buyOrder)
    //           ? transaction.buyOrder.price
    //           : 0;
    //         const sellOrderPrice = isIOrder(transaction.sellOrder)
    //           ? transaction.sellOrder.price
    //           : 0;
    //         transaction.type === "BUY" && sellOrderPrice > buyOrderPrice;
    //       }).length;
    //       const lossTrades = totalTrades - winTrades;
    //       const winRate = (winTrades / totalTrades) * 100;
    //       const averageWin = winTrades ? totalPnl / winTrades : 0;
    //       const averageLoss = lossTrades ? totalPnl / lossTrades : 0;
    //       // Final result object to return
    //       const finalResult = {
    //         winRate,
    //         averageWin,
    //         averageLoss,
    //         overallPL: totalPnl,
    //         netPL: totalPnl - totalCharges - totalBrokerage,
    //         totalTrades,
    //         charges: totalCharges,
    //         brokerage: totalBrokerage,
    //         trades: tradeDetails,
    //       };
    //       return finalResult;
    //     } catch (error) {
    //       console.error("Error generating trade diary:", error);
    //       throw error;
    //     }
    //   }
    // }
    // function isIOrder(order: any): order is IOrder {
    //   return order && typeof order.price === "number";
    create(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transactionModel.create(transaction);
        });
    }
}
exports.TransactionRepository = TransactionRepository;
