import OrderModel from "../models/orderModel";
import StockModel from "../models/stockModel";
import { IOrder } from "../models/interfaces/orderInterface";

export class SquareOffService {
  private orderModel;
  private stockModel;

  constructor(orderModel = OrderModel, stockModel = StockModel) {
    this.orderModel = orderModel;
    this.stockModel = stockModel;
  }

  public async autoSquareOff(): Promise<void> {
    try {
      const currentTime = new Date();
      const squareOffTime = new Date();
      squareOffTime.setHours(15, 15, 0, 0);

      if (currentTime < squareOffTime) {
        console.log("Square-off time not reached yet.");
        return;
      }

      const intradayOrders = await this.orderModel
        .find({ isIntraday: true, status: "PENDING" })
        .populate("stock");

      if (intradayOrders.length === 0) {
        console.log("No pending intraday orders for square-off.");
        return;
      }

      const squareOffPromises = intradayOrders.map(async (order: IOrder) => {
        const squareOffType = order.type === "BUY" ? "SELL" : "BUY";

        const stock = await this.stockModel.findById(order.stock);
        if (!stock) {
          console.error(`Stock not found for ID: ${order.stock}`);
          return;
        }

        // Create and save square-off order
        const squareOffOrder = new this.orderModel({
          user: order.user,
          stock: order.stock,
          type: squareOffType,
          orderType: "MARKET",
          quantity: order.quantity,
          price: stock.price,
          status: "COMPLETED",
          isIntraday: true,
        });

        await squareOffOrder.save();

        // Mark original order as completed
        order.status = "COMPLETED";
        order.completedAt = new Date();
        await order.save();

        console.log(`Order ${order._id} squared off successfully.`);
      });

      await Promise.all(squareOffPromises);
      console.log("All intraday orders squared off.");
    } catch (error) {
      console.error("Error during auto square-off:", error);
    }
  }
}
