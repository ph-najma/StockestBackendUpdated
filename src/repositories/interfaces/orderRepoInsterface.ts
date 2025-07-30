import { IBaseRepository } from "./baseRepoInterface";
import { IOrder } from "../../models/interfaces/orderInterface";
import { ILimitOrderQuery } from "../../interfaces/Interfaces";
export interface IOrderRepository extends IBaseRepository<IOrder> {
  findById(orderId: string): Promise<IOrder | null>;
  findOrders(
    UserId: string | undefined,
    skip: number,
    limit: number
  ): Promise<IOrder[] | null>;
  findCompletedOrders(): Promise<IOrder[]>;
  findOrdersByType(query: ILimitOrderQuery): Promise<IOrder[]>;
  getAllOrders(): Promise<IOrder[]>;
  cancelOrder(orderId: string): Promise<IOrder | null>;
  countOrdersByUser(userId: string | undefined): Promise<number>;
}
