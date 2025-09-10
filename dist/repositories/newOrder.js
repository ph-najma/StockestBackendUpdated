"use strict";
// import Order from "../models/orderModel";
// import transactionModel from "../models/transactionModel";
// import Stock from "../models/stockModel";
// import User from "../models/userModel";
// import { ITransaction } from "../models/interfaces/transactionInterface";
// import { IStock } from "../models/interfaces/stockInterface";
// import { IUser } from "../models/interfaces/userInterface";
// import { io } from "../server";
// import notificationModel from "../models/notificationModel";
// import { sendEmail } from "../utils/sendEmail";
// export class newOrderRepository {
//   async matchOrders(): Promise<void> {
//     try {
//       const marketOrders = await Order.find({ status: "PENDING" });
//       for (const order of marketOrders) {
//         const { orderType, type, price, quantity, stock, stopPrice } = order;
//         const oppositeSide = type === "BUY" ? "SELL" : "BUY";
//         const stockDoc = await Stock.findById(stock);
//         if (!stockDoc) continue;
//         let bestOrder;
//         if (orderType === "MARKET") {
//           bestOrder = await Order.findOne({
//             stock,
//             type: oppositeSide,
//             status: "PENDING",
//           }).sort({ price: type === "BUY" ? 1 : -1 });
//         } else if (orderType === "LIMIT") {
//           bestOrder = await Order.findOne({
//             stock,
//             type: oppositeSide,
//             status: "PENDING",
//             price: type === "BUY" ? { $lte: price } : { $gte: price },
//           }).sort({ createdAt: 1 });
//         } else if (orderType === "STOP" && stopPrice) {
//           const shouldTrigger =
//             (type === "BUY" && stockDoc.price >= stopPrice) ||
//             (type === "SELL" && stockDoc.price <= stopPrice);
//           if (shouldTrigger) {
//             bestOrder = await Order.findOne({
//               stock,
//               type: oppositeSide,
//               status: "PENDING",
//             }).sort({ price: type === "BUY" ? 1 : -1 });
//           } else {
//             console.log(`Stop order not triggered yet for order ${order._id}`);
//             continue;
//           }
//         }
//         if (bestOrder && order.user.toString() !== bestOrder.user.toString()) {
//           const matchPrice = bestOrder.price;
//           const matchedQuantity = Math.min(quantity, bestOrder.quantity);
//           // Update orders
//           order.quantity -= matchedQuantity;
//           bestOrder.quantity -= matchedQuantity;
//           if (order.quantity === 0) order.status = "COMPLETED";
//           if (bestOrder.quantity === 0) bestOrder.status = "COMPLETED";
//           await order.save();
//           await bestOrder.save();
//           // Update stock price
//           stockDoc.price = matchPrice;
//           if (type === "BUY") {
//             stockDoc.adjustedVolume += matchedQuantity;
//           } else if (type === "SELL") {
//             stockDoc.adjustedVolume -= matchedQuantity;
//           }
//           await stockDoc.save();
//           // Calculate transaction fees
//           const fees = 0.01 * matchPrice * matchedQuantity;
//           io.emit("stock-update", {
//             stockId: stockDoc._id,
//             price: matchPrice,
//           });
//           const transaction = await transactionModel.create([
//             {
//               buyer: type === "BUY" ? order.user : bestOrder.user,
//               seller: type === "SELL" ? order.user : bestOrder.user,
//               buyOrder: type === "BUY" ? order._id : bestOrder._id,
//               sellOrder: type === "SELL" ? order._id : bestOrder._id,
//               stock: stockDoc._id,
//               type,
//               quantity: matchedQuantity,
//               price: matchPrice,
//               totalAmount: matchPrice * matchedQuantity,
//               fees,
//               status: "COMPLETED",
//               createdAt: new Date(),
//               completedAt: new Date(),
//             },
//           ]);
//           io.emit("transaction-update", transaction[0]);
//           // Send notifications to buyer and seller
//           io.to(transaction[0].buyer.toString()).emit("notification", {
//             message: `Your order to buy ${matchedQuantity} shares of ${stockDoc.symbol} at $${matchPrice} has been completed.`,
//             type: "TRADE_SUCCESS",
//             timestamp: new Date(),
//           });
//           io.to(transaction[0].seller.toString()).emit("notification", {
//             message: `You sold ${matchedQuantity} shares of ${
//               stockDoc.symbol
//             } at $${matchPrice}. Amount credited: $${
//               matchPrice * matchedQuantity - fees
//             }`,
//             type: "TRADE_SUCCESS",
//             timestamp: new Date(),
//           });
//           await notificationModel.create([
//             {
//               user: transaction[0].buyer,
//               message: `Your order to buy ${matchedQuantity} shares of ${stockDoc.symbol} at $${matchPrice} has been completed.`,
//               type: "TRADE_SUCCESS",
//             },
//             {
//               user: transaction[0].seller,
//               message: `You sold ${matchedQuantity} shares of ${
//                 stockDoc.symbol
//               } at $${matchPrice}. Amount credited: $${
//                 matchPrice * matchedQuantity - fees
//               }`,
//               type: "TRADE_SUCCESS",
//             },
//           ]);
//           // Update portfolios and balances
//           await this.updateUserPortfoliosAndBalances(
//             transaction[0],
//             stockDoc,
//             type,
//             matchedQuantity,
//             matchPrice,
//             fees
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Error matching orders:", error);
//     }
//   }
//   private async updateUserPortfoliosAndBalances(
//     transaction: ITransaction,
//     stockDoc: IStock,
//     type: "BUY" | "SELL",
//     matchedQuantity: number,
//     matchPrice: number,
//     fees: number
//   ) {
//     const buyer = await User.findById(transaction.buyer);
//     const seller = await User.findById(transaction.seller);
//     // Update buyer's portfolio and balance
//     if (buyer) {
//       const totalCost = matchPrice * matchedQuantity + fees;
//       if (buyer.balance >= totalCost) {
//         buyer.balance -= totalCost;
//         await buyer.save();
//         this.updatePortfolio(buyer, stockDoc._id, true, matchedQuantity);
//       } else {
//         console.error("Insufficient balance for buyer:", buyer._id);
//       }
//       if (buyer.email) {
//         sendEmail(
//           buyer.email,
//           "Stock Purchase Confirmation",
//           `Your order to buy ${matchedQuantity} shares of ${stockDoc.symbol} at $${matchPrice} has been completed.`
//         );
//       }
//     }
//     // Update seller's portfolio and balance
//     if (seller) {
//       const totalCredit = matchPrice * matchedQuantity - fees;
//       seller.balance += totalCredit; // Credit balance
//       await seller.save();
//       this.updatePortfolio(seller, stockDoc._id, false, matchedQuantity);
//       if (seller.email) {
//         sendEmail(
//           seller.email,
//           "Stock Sale Confirmation",
//           `You sold ${matchedQuantity} shares of ${
//             stockDoc.symbol
//           } at $${matchPrice}. Amount credited: $${
//             matchPrice * matchedQuantity - fees
//           }`
//         );
//       }
//     }
//   }
//   private async updatePortfolio(
//     user: IUser,
//     stockId: IStock["_id"],
//     isBuy: boolean,
//     matchedQuantity: number
//   ) {
//     if (isBuy) {
//       const existingPortfolio = await User.findOne({
//         _id: user._id,
//         "portfolio.stockId": stockId,
//       });
//       if (existingPortfolio) {
//         await User.findOneAndUpdate(
//           { _id: user._id, "portfolio.stockId": stockId },
//           {
//             $inc: { "portfolio.$.quantity": matchedQuantity },
//           },
//           { new: true }
//         );
//       } else {
//         await User.updateOne(
//           { _id: user._id },
//           {
//             $push: {
//               portfolio: {
//                 stockId,
//                 quantity: matchedQuantity,
//               },
//             },
//           },
//           { new: true }
//         );
//       }
//     } else {
//       const updateResult = await User.findOneAndUpdate(
//         { _id: user._id, "portfolio.stockId": stockId },
//         {
//           $inc: { "portfolio.$.quantity": -matchedQuantity },
//         },
//         { new: true }
//       );
//       // Remove the stock from portfolio if the quantity reaches zero.
//       if (updateResult?.portfolio.some((item: any) => item.quantity === 0)) {
//         await User.updateOne(
//           { _id: user._id },
//           {
//             $pull: { portfolio: { stockId, quantity: 0 } },
//           }
//         );
//       }
//     }
//   }
// }
