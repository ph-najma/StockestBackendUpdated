import { IOrderRepository } from "../repositories/interfaces/orderRepoInsterface";
import { IStockRepository } from "../repositories/interfaces/stockRepoInterface";
import { IuserRepsitory } from "../repositories/interfaces/userRepoInterface";
import { ITransactionRepository } from "../repositories/interfaces/transactionRepoInterface";
import { INotificationRepository } from "../repositories/interfaces/notificationRepoInterface";
import { IOrder } from "../models/interfaces/orderInterface";
import { Server } from "socket.io";
import { sendEmail } from "../utils/sendEmail";
export class OrderMatchingService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly userRepo: IuserRepsitory,
    private readonly transactionRepo: ITransactionRepository,
    private readonly notificationRepo: INotificationRepository,
    private readonly io: Server
  ) {}

  async matchOrders() {
    const marketOrders = await this.orderRepo.findPendingOrders();

    for (const order of marketOrders) {
      const { orderType, type, price, quantity, stock, stopPrice } = order;
      const oppositeSide = type === "BUY" ? "SELL" : "BUY";
      const stockDoc = await this.stockRepo.getStockById(stock);
      if (!stockDoc) continue;

      let bestOrder;

      if (orderType === "MARKET") {
        bestOrder = await this.orderRepo.findBestOrder(stock, oppositeSide, {
          sort: { price: type === "BUY" ? 1 : -1 },
        });
      } else if (orderType === "LIMIT") {
        bestOrder = await this.orderRepo.findBestOrder(stock, oppositeSide, {
          price: type === "BUY" ? { $lte: price } : { $gte: price },
          sort: { createdAt: 1 },
        });
      } else if (orderType === "STOP" && stopPrice) {
        const shouldTrigger =
          (type === "BUY" && stockDoc.price >= stopPrice) ||
          (type === "SELL" && stockDoc.price <= stopPrice);

        if (!shouldTrigger) continue;

        bestOrder = await this.orderRepo.findBestOrder(stock, oppositeSide, {
          sort: { price: type === "BUY" ? 1 : -1 },
        });
      }

      if (bestOrder && order.user.toString() !== bestOrder.user.toString()) {
        await this.executeTrade(order, bestOrder, stockDoc, type);
      }
    }
  }

  private async executeTrade(
    order: any,
    bestOrder: any,
    stockDoc: any,
    type: "BUY" | "SELL"
  ) {
    const matchPrice = bestOrder.price;
    const matchedQuantity = Math.min(order.quantity, bestOrder.quantity);
    const fees = 0.01 * matchPrice * matchedQuantity;

    // Update orders
    order.quantity -= matchedQuantity;
    bestOrder.quantity -= matchedQuantity;
    if (order.quantity === 0) order.status = "COMPLETED";
    if (bestOrder.quantity === 0) bestOrder.status = "COMPLETED";
    await this.orderRepo.save(order);
    await this.orderRepo.save(bestOrder);

    // Update stock
    stockDoc.price = matchPrice;
    stockDoc.adjustedVolume +=
      type === "BUY" ? matchedQuantity : -matchedQuantity;
    await this.stockRepo.save(stockDoc);

    // Save transaction
    const transaction = await this.transactionRepo.create([
      {
        buyer: type === "BUY" ? order.user : bestOrder.user,
        seller: type === "SELL" ? order.user : bestOrder.user,
        stock: stockDoc._id,
        type,
        quantity: matchedQuantity,
        price: matchPrice,
        totalAmount: matchPrice * matchedQuantity,
        fees,
        status: "COMPLETED",
        createdAt: new Date(),
        completedAt: new Date(),
      },
    ]);

    this.io.emit("stock-update", { stockId: stockDoc._id, price: matchPrice });
    this.io.emit("transaction-update", transaction[0]);

    await this.handleNotifications(
      transaction[0],
      stockDoc,
      matchedQuantity,
      matchPrice,
      fees
    );
    await this.updateUserBalances(
      transaction[0],
      stockDoc,
      type,
      matchedQuantity,
      matchPrice,
      fees
    );
  }

  private async handleNotifications(
    transaction: any,
    stockDoc: any,
    qty: number,
    price: number,
    fees: number
  ) {
    const messages = [
      {
        user: transaction.buyer,
        message: `Your order to buy ${qty} shares of ${stockDoc.symbol} at $${price} has been completed.`,
        type: "TRADE_SUCCESS",
      },
      {
        user: transaction.seller,
        message: `You sold ${qty} shares of ${
          stockDoc.symbol
        } at $${price}. Amount credited: $${price * qty - fees}`,
        type: "TRADE_SUCCESS",
      },
    ];

    await this.notificationRepo.create(messages);

    this.io.to(transaction.buyer.toString()).emit("notification", messages[0]);
    this.io.to(transaction.seller.toString()).emit("notification", messages[1]);
  }

  private async updateUserBalances(
    transaction: any,
    stockDoc: any,
    type: "BUY" | "SELL",
    qty: number,
    price: number,
    fees: number
  ) {
    const buyer = await this.userRepo.findById(transaction.buyer);
    const seller = await this.userRepo.findById(transaction.seller);

    if (buyer) {
      const totalCost = price * qty + fees;
      buyer.balance -= totalCost;
      await this.userRepo.save(buyer);
      await this.userRepo.updatePortfolio(buyer._id, stockDoc._id, true, qty);

      if (buyer.email) {
        sendEmail(
          buyer.email,
          "Stock Purchase Confirmation",
          `You bought ${qty} shares of ${stockDoc.symbol} at $${price}.`
        );
      }
    }

    if (seller) {
      const totalCredit = price * qty - fees;
      seller.balance += totalCredit;
      await this.userRepo.save(seller);
      await this.userRepo.updatePortfolio(seller._id, stockDoc._id, false, qty);

      if (seller.email) {
        sendEmail(
          seller.email,
          "Stock Sale Confirmation",
          `You sold ${qty} shares of ${stockDoc.symbol} at $${price}.`
        );
      }
    }
  }
}
