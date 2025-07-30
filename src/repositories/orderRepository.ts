import { ILimitOrderQuery, OrderStatus } from "../interfaces/Interfaces";
import { BaseRepository } from "./BaseRepository";
import { Model } from "mongoose";
import { IOrder } from "../models/interfaces/orderInterface";
import { IOrderRepository } from "./interfaces/orderRepoInsterface";

export class OrderRepository
  extends BaseRepository<IOrder>
  implements IOrderRepository
{
  constructor(model: Model<IOrder>) {
    super(model);
  }
  async findById(orderId: string): Promise<IOrder | null> {
    return this.model
      .findById(orderId)
      .populate("user")
      .populate("stock")
      .exec();
  }
  async findOrders(
    UserId: string | undefined,
    skip: number,
    limit: number
  ): Promise<IOrder[] | null> {
    return this.model
      .find({ user: UserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("stock", "symbol name")
      .exec();
  }

  async findCompletedOrders(): Promise<IOrder[]> {
    return this.model
      .find({ status: OrderStatus.COMPLETED })
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("stock")
      .exec();
  }

  async findOrdersByType(query: ILimitOrderQuery): Promise<IOrder[]> {
    return this.model
      .find(query)
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("stock")
      .exec();
  }
  // async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
  //   return Order.create(orderData);
  // }
  async getAllOrders(): Promise<IOrder[]> {
    return this.model
      .find()
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("stock")
      .exec();
  }
  async cancelOrder(orderId: string): Promise<IOrder | null> {
    const updatedOrder = await this.model
      .findByIdAndUpdate(orderId, { status: OrderStatus.FAILED }, { new: true })
      .exec();

    return updatedOrder;
  }
  async countOrdersByUser(userId: string | undefined): Promise<number> {
    return this.model.countDocuments({ user: userId }).exec();
  }
}
