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
exports.OrderMatchingService = void 0;
const sendEmail_1 = require("../utils/sendEmail");
class OrderMatchingService {
    constructor(orderRepo, stockRepo, userRepo, transactionRepo, notificationRepo, io) {
        this.orderRepo = orderRepo;
        this.stockRepo = stockRepo;
        this.userRepo = userRepo;
        this.transactionRepo = transactionRepo;
        this.notificationRepo = notificationRepo;
        this.io = io;
    }
    matchOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const marketOrders = yield this.orderRepo.findPendingOrders();
            for (const order of marketOrders) {
                const { orderType, type, price, quantity, stock, stopPrice } = order;
                const oppositeSide = type === "BUY" ? "SELL" : "BUY";
                const stockDoc = yield this.stockRepo.getStockById(stock);
                if (!stockDoc)
                    continue;
                let bestOrder;
                if (orderType === "MARKET") {
                    bestOrder = yield this.orderRepo.findBestOrder(stock, oppositeSide, {
                        sort: { price: type === "BUY" ? 1 : -1 },
                    });
                }
                else if (orderType === "LIMIT") {
                    bestOrder = yield this.orderRepo.findBestOrder(stock, oppositeSide, {
                        price: type === "BUY" ? { $lte: price } : { $gte: price },
                        sort: { createdAt: 1 },
                    });
                }
                else if (orderType === "STOP" && stopPrice) {
                    const shouldTrigger = (type === "BUY" && stockDoc.price >= stopPrice) ||
                        (type === "SELL" && stockDoc.price <= stopPrice);
                    if (!shouldTrigger)
                        continue;
                    bestOrder = yield this.orderRepo.findBestOrder(stock, oppositeSide, {
                        sort: { price: type === "BUY" ? 1 : -1 },
                    });
                }
                if (bestOrder && order.user.toString() !== bestOrder.user.toString()) {
                    yield this.executeTrade(order, bestOrder, stockDoc, type);
                }
            }
        });
    }
    executeTrade(order, bestOrder, stockDoc, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchPrice = bestOrder.price;
            const matchedQuantity = Math.min(order.quantity, bestOrder.quantity);
            const fees = 0.01 * matchPrice * matchedQuantity;
            // Update orders
            order.quantity -= matchedQuantity;
            bestOrder.quantity -= matchedQuantity;
            if (order.quantity === 0)
                order.status = "COMPLETED";
            if (bestOrder.quantity === 0)
                bestOrder.status = "COMPLETED";
            yield this.orderRepo.save(order);
            yield this.orderRepo.save(bestOrder);
            // Update stock
            stockDoc.price = matchPrice;
            stockDoc.adjustedVolume +=
                type === "BUY" ? matchedQuantity : -matchedQuantity;
            yield this.stockRepo.save(stockDoc);
            // Save transaction
            const transaction = yield this.transactionRepo.create([
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
            yield this.handleNotifications(transaction[0], stockDoc, matchedQuantity, matchPrice, fees);
            yield this.updateUserBalances(transaction[0], stockDoc, type, matchedQuantity, matchPrice, fees);
        });
    }
    handleNotifications(transaction, stockDoc, qty, price, fees) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = [
                {
                    user: transaction.buyer,
                    message: `Your order to buy ${qty} shares of ${stockDoc.symbol} at $${price} has been completed.`,
                    type: "TRADE_SUCCESS",
                },
                {
                    user: transaction.seller,
                    message: `You sold ${qty} shares of ${stockDoc.symbol} at $${price}. Amount credited: $${price * qty - fees}`,
                    type: "TRADE_SUCCESS",
                },
            ];
            yield this.notificationRepo.create(messages);
            this.io.to(transaction.buyer.toString()).emit("notification", messages[0]);
            this.io.to(transaction.seller.toString()).emit("notification", messages[1]);
        });
    }
    updateUserBalances(transaction, stockDoc, type, qty, price, fees) {
        return __awaiter(this, void 0, void 0, function* () {
            const buyer = yield this.userRepo.findById(transaction.buyer);
            const seller = yield this.userRepo.findById(transaction.seller);
            if (buyer) {
                const totalCost = price * qty + fees;
                buyer.balance -= totalCost;
                yield this.userRepo.save(buyer);
                yield this.userRepo.updatePortfolio(buyer._id, stockDoc._id, true, qty);
                if (buyer.email) {
                    (0, sendEmail_1.sendEmail)(buyer.email, "Stock Purchase Confirmation", `You bought ${qty} shares of ${stockDoc.symbol} at $${price}.`);
                }
            }
            if (seller) {
                const totalCredit = price * qty - fees;
                seller.balance += totalCredit;
                yield this.userRepo.save(seller);
                yield this.userRepo.updatePortfolio(seller._id, stockDoc._id, false, qty);
                if (seller.email) {
                    (0, sendEmail_1.sendEmail)(seller.email, "Stock Sale Confirmation", `You sold ${qty} shares of ${stockDoc.symbol} at $${price}.`);
                }
            }
        });
    }
}
exports.OrderMatchingService = OrderMatchingService;
