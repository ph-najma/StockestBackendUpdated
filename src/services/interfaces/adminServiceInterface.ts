import {
  IAdminDashboardSummary,
  OrderDto,
  StockDto,
  TransactionDto,
  SessionDto,
  UserDto,
} from "../../interfaces/Interfaces";
import { ISession } from "../../models/interfaces/sessionInterface";
import { ILimit } from "../../models/interfaces/limitInterface";
import { ILimitOrderQuery } from "../../interfaces/Interfaces";
export interface IAdminService {
  loginAdmin(email: string, password: string): Promise<{ token: string }>;
  getUserList(): Promise<UserDto[]>;
  toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }>;
  getAdminDashboard(): Promise<IAdminDashboardSummary>;
  getAllOrders(): Promise<OrderDto[]>;
  getLimitOrders(query: ILimitOrderQuery): Promise<OrderDto[]>;
  getMarketOrders(query: ILimitOrderQuery): Promise<OrderDto[]>;
  getCompletedOrders(): Promise<OrderDto[]>;
  getAllStocks(): Promise<StockDto[]>;
  getAllTransactions(): Promise<TransactionDto[]>;
  getUserPortfolio(userId: string): Promise<{
    user: {
      name: string | undefined;
      email: string | undefined;
      balance: number;
    };
    portfolio: {
      stock: StockDto | null;
      quantity: number;
    }[];
  }>;
  getTotalFeesCollected(): Promise<number>;
  cancelOrder(orderId: string): Promise<OrderDto | null>;
  updateLimit(limitData: ILimit): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
  CreatePromotions(data: any): Promise<any>;
  createSsession(data: ISession): Promise<SessionDto | null>;
  getAllSessions(): Promise<SessionDto[] | null>;
  getSessionById(sessionId: string): Promise<SessionDto | null>;
  updateSessionData(
    sessionId: string,
    data: Partial<SessionDto>
  ): Promise<SessionDto | null>;
  cancelSession(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<SessionDto | null>;
  countUsers(): Promise<number>;
}
