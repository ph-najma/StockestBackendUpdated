import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ILimitOrderQuery } from "../interfaces/Interfaces";
import { IAdminService } from "./interfaces/adminServiceInterface";
import { ILimit } from "../models/interfaces/limitInterface";
import { IUser } from "../models/interfaces/userInterface";
import { ITransaction } from "../models/interfaces/transactionInterface";
import { IStock } from "../models/interfaces/stockInterface";
import { ISession } from "../models/interfaces/sessionInterface";
import { IOrder } from "../models/interfaces/orderInterface";
import { ITransactionRepository } from "../repositories/interfaces/transactionRepoInterface";
import { IStockRepository } from "../repositories/interfaces/stockRepoInterface";
import { ISessionRepository } from "../repositories/interfaces/sessionRepoInterface";
import { IpromotionRepsoitory } from "../repositories/interfaces/promotionRepoInterface";
import { IOrderRepository } from "../repositories/interfaces/orderRepoInsterface";
import { ILimitRepository } from "../repositories/interfaces/baseRepoInterface";
import { IuserRepsitory } from "../repositories/interfaces/userRepoInterface";
import {
  IAdminDashboardSummary,
  UserDto,
  OrderDto,
  StockDto,
  TransactionDto,
  SessionDto,
} from "../interfaces/Interfaces";
dotenv.config();

const tokenBlacklist = new Set<string>();

export class AdminService implements IAdminService {
  private userRepository: IuserRepsitory;
  private orderRepository: IOrderRepository;
  private stockRepository: IStockRepository;
  private transactionRepository: ITransactionRepository;
  private limitRepository: ILimitRepository;
  private promotionRepository: IpromotionRepsoitory;
  private sessionRepository: ISessionRepository;
  constructor(
    userRepository: IuserRepsitory,
    limitRepository: ILimitRepository,
    orderRepository: IOrderRepository,
    stockRepository: IStockRepository,
    transactionRepository: ITransactionRepository,
    promotionRepository: IpromotionRepsoitory,
    sessionRepository: ISessionRepository
  ) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.stockRepository = stockRepository;
    this.transactionRepository = transactionRepository;
    this.limitRepository = limitRepository;
    this.promotionRepository = promotionRepository;
    this.sessionRepository = sessionRepository;
  }

  private toUserDto(user: IUser): UserDto {
    return {
      id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      balance: user.balance,
      role: (user as any).role,
    };
  }

  private toStockDto(stock: IStock): StockDto {
    return {
      id: (stock as any)._id?.toString?.() ?? "",
      symbol: (stock as any).symbol,
      name: (stock as any).name,
      price: (stock as any).price,
    };
  }

  private toOrderDto(order: IOrder): OrderDto {
    return {
      id: (order as any)._id?.toString?.() ?? "",
      userId: (order as any).user?.toString?.() ?? "",
      stock:
        (order as any).stock && typeof (order as any).stock === "object"
          ? this.toStockDto((order as any).stock as any)
          : (order as any).stock,
      type: (order as any).type,
      orderType: (order as any).orderType,
      quantity: (order as any).quantity,
      price: (order as any).price,
      status: (order as any).status,
      createdAt:
        (order as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private toTransactionDto(tx: ITransaction): TransactionDto {
    return {
      id: (tx as any)._id?.toString?.() ?? "",
      userId: (tx as any).user?.toString?.() ?? "",
      amount: (tx as any).price * (tx as any).quantity,
      type: (tx as any).type,
      createdAt:
        (tx as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private toSessionDto(session: ISession): SessionDto {
    return {
      id: (session as any)._id?.toString?.() ?? "",
      title: (session as any).title,
      instructorId: (session as any).instructorId?.toString?.() ?? "",
      scheduledAt:
        (session as any).scheduledAt?.toISOString?.() ??
        new Date().toISOString(),
    };
  }

  // Admin Login
  async loginAdmin(
    email: string,
    password: string
  ): Promise<{ token: string }> {
    const existingUser = await this.userRepository.findAdminByEmail(email);
    if (!existingUser) {
      throw new Error("No such user");
    }

    const isMatch = await existingUser.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return { token };
  }

  // Get User List
  async getUserList(): Promise<UserDto[]> {
    const users = await this.userRepository.findAllUsers();
    return users.map((u) => this.toUserDto(u));
  }

  async getAdminDashboard(): Promise<IAdminDashboardSummary> {
    const totalUsers = await this.userRepository.countUser();
    const sessions = await this.getAllSessions();
    const completed = (sessions as any)?.filter(
      (s: any) => s.status === "COMPLETED"
    ).length;
    const canceled = (sessions as any)?.filter(
      (s: any) => s.status === "CANCELED"
    ).length;

    const transactions = await this.transactionRepository.getAllTransactions();
    const tradingVolume = transactions.reduce(
      (acc, tx) => acc + tx.price * tx.quantity,
      0
    );
    const totalProfitLoss = transactions.reduce((acc, tx) => {
      return tx.type === "SELL" ? acc + tx.price * tx.quantity : acc;
    }, 0);
    const feeCollection =
      await this.transactionRepository.getFeeCollectionSummary();
    return {
      totalUsers,
      completed,
      canceled,
      tradingVolume,
      totalProfitLoss,
      feeCollection,
    };
  }

  // Disable or Enable User
  async toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.is_Blocked = !user.is_Blocked;
    await this.userRepository.saveUser(user);

    if (token) {
      tokenBlacklist.add(token);
    }

    return {
      message: `${
        user.is_Blocked ? "Blocked" : "Unblocked"
      } user successfully.`,
    };
  }
  async countUsers(): Promise<number> {
    return await this.userRepository.countUser();
  }
  //Get All Orders
  async getAllOrders(): Promise<OrderDto[]> {
    const orders = await this.orderRepository.getAllOrders();
    return orders.map((o) => this.toOrderDto(o));
  }
  //Get Limit Orders

  async getLimitOrders(query: ILimitOrderQuery): Promise<OrderDto[]> {
    query.orderType = "LIMIT";
    const orders = await this.orderRepository.findOrdersByType(query);
    return orders.map((o) => this.toOrderDto(o));
  }
  //Get Market Orders

  async getMarketOrders(query: ILimitOrderQuery): Promise<OrderDto[]> {
    query.orderType = "MARKET";
    const orders = await this.orderRepository.findOrdersByType(query);
    return orders.map((o) => this.toOrderDto(o));
  }
  //Get Completed Orders

  async getCompletedOrders(): Promise<OrderDto[]> {
    const orders = await this.orderRepository.findCompletedOrders();
    return orders.map((o) => this.toOrderDto(o));
  }

  //Get All Stocks
  async getAllStocks(): Promise<StockDto[]> {
    const stocks = await this.stockRepository.getAllStocks();
    return stocks.map((s) => this.toStockDto(s));
  }

  //Get All Transactiosn
  async getAllTransactions(): Promise<TransactionDto[]> {
    const txs = await this.transactionRepository.getAllTransactions();
    return txs.map((t) => this.toTransactionDto(t));
  }

  //Get UserPortfolio
  async getUserPortfolio(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await this.userRepository.findById(userObjectId);
    if (!user) {
      throw new Error("User not found");
    }
    const portfolio = user.portfolio as {
      stockId: mongoose.Types.ObjectId;
      quantity: number;
    }[];
    const portfolioDetails = await Promise.all(
      portfolio.map(async (item) => {
        const stockId = item.stockId; // Convert ObjectId to string
        const stock = await this.stockRepository.getStockById(stockId);
        return {
          stock: stock ? this.toStockDto(stock) : null,
          quantity: item.quantity,
        };
      })
    );
    return {
      user: {
        name: user.name,
        email: user.email,
        balance: user.balance,
      },
      portfolio: portfolioDetails,
    };
  }
  //Get Total Fees Collected
  async getTotalFeesCollected(): Promise<number> {
    return this.transactionRepository.getFeeCollectionSummary();
  }

  // Cancel Order
  async cancelOrder(orderId: string): Promise<OrderDto | null> {
    const order = await this.orderRepository.cancelOrder(orderId);
    return order ? this.toOrderDto(order) : null;
  }

  //Update the Limits
  async updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null> {
    return await this.limitRepository.updateLimit(limitData);
  }
  //Get the Current Limits
  async getLimits(): Promise<ILimit | null> {
    return await this.limitRepository.getLimits();
  }

  async CreatePromotions(data: any): Promise<any> {
    return await this.promotionRepository.createPromotion(data);
  }

  async createSsession(data: ISession): Promise<SessionDto | null> {
    const session = await this.sessionRepository.createSession(data);
    return session ? this.toSessionDto(session) : null;
  }
  async getAllSessions(): Promise<SessionDto[] | null> {
    const sessions = await this.sessionRepository.getAllSessions();
    return sessions ? sessions.map((s) => this.toSessionDto(s)) : null;
  }
  async getSessionById(sessionId: string): Promise<SessionDto | null> {
    const session = await this.sessionRepository.getSessionById(sessionId);
    return session ? this.toSessionDto(session) : null;
  }
  async updateSessionData(
    sessionId: string,
    data: Partial<ISession>
  ): Promise<SessionDto | null> {
    const session = await this.sessionRepository.updateSession(sessionId, data);
    return session ? this.toSessionDto(session) : null;
  }
  async cancelSession(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<SessionDto | null> {
    const session = await this.sessionRepository.updateSessionStatus(
      sessionId,
      newStatus
    );
    return session ? this.toSessionDto(session) : null;
  }
}
