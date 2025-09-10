import { IUser } from "../../models/interfaces/userInterface";
import { IAdminDashboardSummary } from "../../interfaces/Interfaces";
import { IOrder } from "../../models/interfaces/orderInterface";
import { ILimitOrderQuery } from "../../interfaces/Interfaces";
import { IStock } from "../../models/interfaces/stockInterface";
import { ITransaction } from "../../models/interfaces/transactionInterface";
import { ILimit } from "../../models/interfaces/limitInterface";
import { ISession } from "../../models/interfaces/sessionInterface";
export interface IAdminService {
  loginAdmin(email: string, password: string): Promise<{ token: string }>;
  getUserList(): Promise<IUser[]>;
  toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }>;
  getAdminDashboard(): Promise<IAdminDashboardSummary>;
  getAllOrders(): Promise<IOrder[]>;
  getLimitOrders(query: ILimitOrderQuery): Promise<IOrder[]>;
  getMarketOrders(query: ILimitOrderQuery): Promise<IOrder[]>;
  getCompletedOrders(): Promise<IOrder[]>;
  getAllStocks(): Promise<IStock[]>;
  getAllTransactions(): Promise<ITransaction[]>;
  getUserPortfolio(userId: string): Promise<{
    user: {
      name: string | undefined;
      email: string | undefined;
      balance: number;
    };
    portfolio: {
      stock: IStock | null;
      quantity: number;
    }[];
  }>;
  getTotalFeesCollected(): Promise<number>;
  cancelOrder(orderId: string): Promise<IOrder | null>;
  updateLimit(limitData: ILimit): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
  CreatePromotions(data: any): Promise<any>;
  createSsession(data: ISession): Promise<ISession | null>;
  getAllSessions(): Promise<ISession[] | null>;
  getSessionById(sessionId: string): Promise<ISession | null>;
  updateSessionData(
    sessionId: string,
    data: Partial<ISession>
  ): Promise<ISession | null>;
  cancelSession(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<ISession | null>;
  countUsers(): Promise<number>;
}
