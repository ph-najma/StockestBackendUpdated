import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail";
import { generateOTP } from "../utils/otpGenerator";
import { OtpStoreEntry } from "../interfaces/Interfaces";
import { IWatchlistRepository } from "../repositories/interfaces/watchlistRepoInterface";
import { IuserRepsitory } from "../repositories/interfaces/userRepoInterface";
import { ITransactionRepository } from "../repositories/interfaces/transactionRepoInterface";
import { IStockRepository } from "../repositories/interfaces/stockRepoInterface";
import { IpromotionRepsoitory } from "../repositories/interfaces/promotionRepoInterface";
import { ISessionRepository } from "../repositories/interfaces/sessionRepoInterface";
import { IOrderRepository } from "../repositories/interfaces/orderRepoInsterface";
import { INotificationRepository } from "../repositories/interfaces/notificationRepoInterface";
import { INotification } from "../models/interfaces/notificationInterface";
import { ISession } from "../models/interfaces/sessionInterface";
import { IStock } from "../models/interfaces/stockInterface";
import { IPromotion } from "../models/interfaces/promotionInterface";
import { IUser } from "../models/interfaces/userInterface";
import { IWatchlist } from "../models/interfaces/watchlistInterface";
import { ITransaction } from "../models/interfaces/transactionInterface";
import { IOrder } from "../models/interfaces/orderInterface";
import {
  ITradeDiary,
  UserDto,
  StockDto,
  OrderDto,
  TransactionDto,
  SessionDto,
  NotificationDto,
  PromotionDto,
  WatchlistItemDto,
} from "../interfaces/Interfaces";
import { isIOrder } from "../helper/helper";
import { IUserService } from "./interfaces/userServiceInterface";
import { IUploadRepository } from "../repositories/interfaces/IUploadRepository";
type ObjectId = mongoose.Types.ObjectId;

dotenv.config();

const otpStore: Map<string, OtpStoreEntry> = new Map();

export class UserService implements IUserService {
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

  private toNotificationDto(n: INotification): NotificationDto {
    return {
      id: (n as any)._id?.toString?.() ?? "",
      userId: (n as any).userId?.toString?.() ?? "",
      title: (n as any).title,
      body: (n as any).body,
      createdAt:
        (n as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private toPromotionDto(p: IPromotion): PromotionDto {
    return {
      id: (p as any)._id?.toString?.() ?? "",
      title: (p as any).title,
      description: (p as any).description,
    };
  }

  private toWatchlistItemDto(item: IWatchlist): WatchlistItemDto {
    return {
      id: (item as any)._id?.toString?.() ?? "",
      symbol: (item as any).symbol ?? (item as any).stocksymbol ?? "",
    };
  }

  private userRepository: IuserRepsitory;
  private orderRepository: IOrderRepository;
  private transactionRepository: ITransactionRepository;
  private stockRepository: IStockRepository;
  private promotionRepository: IpromotionRepsoitory;
  private watchlistRepository: IWatchlistRepository;
  private sessionRepository: ISessionRepository;
  private notificationRepository: INotificationRepository;
  private uploadRepository: IUploadRepository;

  constructor(
    stockRepository: IStockRepository,
    userRepository: IuserRepsitory,
    transactionRepository: ITransactionRepository,
    orderRepository: IOrderRepository,
    promotionRepository: IpromotionRepsoitory,
    watchlistRepsoitory: IWatchlistRepository,
    sessionRepository: ISessionRepository,
    notificationRepository: INotificationRepository,
    uploadRepository: IUploadRepository
  ) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.transactionRepository = transactionRepository;
    this.stockRepository = stockRepository;
    this.promotionRepository = promotionRepository;
    this.watchlistRepository = watchlistRepsoitory;
    this.sessionRepository = sessionRepository;
    this.notificationRepository = notificationRepository;
    this.uploadRepository = uploadRepository;
  }

  // Sign up a new user
  async signup(
    name: string,
    email: string,
    password: string,
    role: string,
    referralCode?: string
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const otp = generateOTP();
    const generatedReferralCode = crypto.randomBytes(4).toString("hex");
    otpStore.set(otp, {
      name,
      email,
      password,
      role,
      otp,
      refferedBy: referralCode,
    });
    await sendEmail(
      email,
      "Your OTP for user verification",
      `Your OTP is ${otp}. Please enter this code to verify your account.`
    );
  }

  async updateProfilePhoto(
    userId: string | undefined,
    profileImageUrl: string
  ): Promise<UserDto | null> {
    if (!userId) return null;
    const updated = await this.userRepository.updateById(userId as any, {
      profilePhoto: profileImageUrl,
    });
    return updated ? this.toUserDto(updated) : null;
  }

  // Verify OTP
  async verifyOtp(otp: string): Promise<{ token: string }> {
    const pendingUser = otpStore.get(otp);
    if (!pendingUser) {
      throw new Error("Invalid OTP");
    }
    const referredBy = pendingUser.refferedBy;
    if (pendingUser.role == "instructor") {
      const newUser = await this.userRepository.save({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        is_instructor: true,
      });
      otpStore.delete(otp);
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
      return { token };
    } else {
      const newUser = await this.userRepository.save({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        referralCode: crypto.randomBytes(4).toString("hex"),
        referredBy,
      });

      otpStore.delete(otp);
      const promotion = await this.promotionRepository.findPromotion();
      if (promotion && promotion.signupBonus.enabled) {
        await this.userRepository.addSignupBonus(
          newUser._id.toString(),
          "signup"
        );
      }
      if (referredBy) {
        const referrer = await this.userRepository.findByRefferalCode(
          referredBy
        );
        if (referrer) {
          await this.userRepository.addSignupBonus(
            referrer._id.toString(),
            "referral"
          );
        }
      }
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
      return { token };
    }
  }
  //Resend OTP
  async resendOtp(email: string): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already registered");
    }

    // Find the pending OTP entry for the user
    const pendingUserEntry = Array.from(otpStore.values()).find(
      (entry) => entry.email === email
    );

    if (!pendingUserEntry) {
      throw new Error("No pending registration found for this email");
    }

    const newOtp = generateOTP();
    otpStore.set(newOtp, { ...pendingUserEntry, otp: newOtp });

    // Remove the old OTP entry for the same email
    otpStore.forEach((value, key) => {
      if (value.email === email && key !== newOtp) {
        otpStore.delete(key);
      }
    });

    await sendEmail(
      email,
      "Your OTP for user verification",
      `Your OTP is ${newOtp}. Please enter this code to verify your account.`
    );

    return "OTP resent to email";
  }
  async getAuthParams(): Promise<any> {
    return this.uploadRepository.generateAuthParameters();
  }
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<any> {
    if (!fileBuffer || !fileName) throw new Error("Invalid file data");
    return await this.uploadRepository.uploadImage(fileBuffer, fileName);
  }
  // Login user
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string; user: UserDto }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("No such user");
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "7d",
      }
    );
    await this.userRepository.updateById(user._id.toString(), {
      refreshToken: refreshToken,
    });

    return { token, refreshToken, user: this.toUserDto(user) };
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    console.log(user);

    const otp = generateOTP();
    const otpExpiration = Date.now() + 10 * 60 * 1000;

    otpStore.set(email, { userId: user._id.toString(), otp, otpExpiration });

    console.log(otpStore);
    await sendEmail(
      email,
      "Your OTP for user verification",
      `Your OTP is ${otp}. Please enter this code to verify your account.`
    );
  }

  // Reset password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const otpEntry = otpStore.get(email);

    if (
      !otpEntry ||
      otpEntry.otp !== otp ||
      otpEntry.otpExpiration! < Date.now()
    ) {
      throw new Error("Invalid or expired OTP");
    }

    await this.userRepository.updatePassword(email, newPassword);
    otpStore.delete(email);
  }
  //Home
  async home(): Promise<void> {}

  //Get User Profle
  async getUserProfile(userId: string | undefined): Promise<UserDto | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("user not found");
    }
    return this.toUserDto(user);
  }

  //Get User Portfolio
  async getUserPortfolio(userId: string | undefined): Promise<UserDto | null> {
    const user = await this.userRepository.findById(userId);
    return user ? this.toUserDto(user) : null;
  }

  async getUpdatedPortfolio(user: UserDto): Promise<any> {
    const fullUser = await this.userRepository.findById(user.id);
    if (!fullUser) {
      throw new Error("user not found");
    }
    let totalPortfolioValue = 0;
    let overallProfit = 0;
    let todaysProfit = 0;

    const updatedPortfolio = await Promise.all(
      fullUser.portfolio.map(async (item) => {
        const stock = await this.getStockById(
          item.stockId instanceof mongoose.Types.ObjectId
            ? item.stockId.toString()
            : item.stockId
        );
        if (!stock) return item;

        const stockValue = (stock as any).price * item.quantity;
        const profit = stockValue - (stock as any).open * item.quantity;
        const todaysChange = (stock as any).changePercent;

        totalPortfolioValue += stockValue;
        overallProfit += profit;
        todaysProfit += (profit * parseFloat(todaysChange)) / 100;

        return {
          ...item,
          stockData: stock,
          currentValue: stockValue,
          overallProfit: profit,
          todaysProfit,
        };
      })
    );

    return {
      portfolio: updatedPortfolio,
      totalPortfolioValue,
      overallProfit,
      todaysProfit,
    };
  }

  //Get All Stocks
  async getAllStocks(): Promise<StockDto[]> {
    const stocks = await this.stockRepository.getAllStocks();
    return stocks.map((s) => this.toStockDto(s));
  }
  async checkPortfolio(
    userId: string,
    stockId: string,
    quantity: number,
    type: "BUY" | "SELL"
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findByIdWithPortfolio(userId);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (type === "SELL") {
      const portfolioItem = user.portfolio.find(
        (item) => item.stockId.toString() === stockId
      );

      if (!portfolioItem || portfolioItem.quantity < quantity) {
        return {
          success: false,
          message: "Insufficient stock in portfolio for this sell order",
        };
      }
    }

    return { success: true, message: "Portfolio check passed" };
  }

  async handleGoogleLogin(profile: any): Promise<UserDto> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error("Email not found in Google profile");

    let user = await this.userRepository.findUserByGoogleId(profile.id);
    if (!user) {
      user = await this.userRepository.save({
        googleId: profile.id,
        name: profile.displayName,
        email,
        profilePhoto: profile.photos?.[0]?.value,
      });
    }
    return this.toUserDto(user);
  }

  //Place an Order
  async placeOrder(
    user: ObjectId | undefined,
    stock: string,
    type: "BUY" | "SELL",
    orderType: "MARKET" | "LIMIT" | "STOP",
    quantity: number,
    price: number,
    stopPrice: number,
    isIntraday: Boolean | undefined
  ): Promise<OrderDto | null> {
    const orderData: Partial<IOrder> = {
      user,
      stock,
      type,
      orderType,
      quantity,
      price,
      stopPrice,
      isIntraday,
    };

    const order = await this.orderRepository.create(orderData);
    return order ? this.toOrderDto(order) : null;
  }

  //Get Transactions of a user
  async getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<TransactionDto[]> {
    const transactions = await this.transactionRepository.getTransactions(
      userId,
      skip,
      limit
    );
    return transactions.map((t) => this.toTransactionDto(t));
  }
  //Get Stock By ID
  async getStockById(userId: string | undefined): Promise<StockDto | null> {
    const stock = await this.stockRepository.getStockById(userId as any);
    return stock ? this.toStockDto(stock) : null;
  }
  //Get Money details
  async getMoneyDetails(userId: string | undefined): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    let totalValue = 0;
    for (const item of user.portfolio) {
      const stock = item.stockId as any;

      totalValue += stock.price * item.quantity;
    }

    // Margin Used
    const marginUsed = Math.max(0, totalValue - user.balance);

    // Utilization %
    const utilization =
      user.balance > 0 ? (marginUsed / user.balance) * 100 : 0;

    return {
      available: user.balance,
      marginUsed,
      utilization,
    };
  }

  async getWatchlist(userId: string | undefined): Promise<WatchlistItemDto[]> {
    const items = await this.watchlistRepository.getByUserId(userId);
    return (items as unknown as any[]).map((i: any) =>
      this.toWatchlistItemDto(i)
    );
  }

  //Update User Portfolio After Sell
  async updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<UserDto | null> {
    const updated = await this.userRepository.updatePortfolioAfterSell(
      userId,
      stockId,
      quantityToSell
    );
    return updated ? this.toUserDto(updated) : null;
  }
  async getMarketPrice(symbol: string): Promise<any> {
    return this.stockRepository.getMarketPrice(symbol);
  }
  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<WatchlistItemDto> {
    const item = await this.watchlistRepository.ensureWatchlistAndAddStock(
      userId,
      stocksymbol
    );
    return this.toWatchlistItemDto(item as any);
  }
  async RemoveStockFromWathclist(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<WatchlistItemDto | null> {
    const removed = await this.watchlistRepository.removeStockFromWatchlist(
      userId,
      stocksymbol
    );
    return removed ? this.toWatchlistItemDto(removed as any) : null;
  }
  async getStockData(symbol: string | undefined): Promise<any> {
    const stockData = await this.stockRepository.getStockData(symbol);
    const formattedData = stockData.map((stock) => ({
      time: stock.timestamp.getTime() / 1000, // Convert to seconds (Unix timestamp)
      open: stock.open,
      high: stock.high,
      low: stock.low,
      close: stock.close,
      volume: stock.volume,
    }));
    return formattedData;
  }

  async getHistorical(symbol: string | undefined): Promise<any> {
    const stockData = await this.stockRepository.getStockData(symbol);
    return stockData;
  }
  async getReferralCode(
    userId: string | undefined
  ): Promise<string | undefined> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.referralCode;
  }
  async getOrders(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<OrderDto[] | null> {
    const orders = await this.orderRepository.findOrders(userId, skip, limit);
    return orders ? orders.map((o) => this.toOrderDto(o)) : null;
  }
  async getUserProfileWithRewards(
    userId: string | undefined
  ): Promise<PromotionDto | null> {
    try {
      const promo = await this.promotionRepository.findPromotion();
      return promo ? this.toPromotionDto(promo) : null;
    } catch (error) {
      throw error;
    }
  }
  // async getTradeDiary(userId: string | undefined): Promise<any> {
  //   try {
  //     const tradeData = await this.transactionRepository.getTradeDiary(userId);
  //     return tradeData;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getTradeDiary(userId: string): Promise<ITradeDiary> {
    const transactions = await this.transactionRepository.getTransactions(
      userId,
      0,
      0
    );

    let totalTrades = 0;
    let totalPnl = 0;
    let totalCharges = 0;
    let totalBrokerage = 0;
    const tradeDetails: ITradeDiary["trades"] = [];

    transactions.forEach((transaction) => {
      const pnl =
        transaction.type === "BUY"
          ? transaction.price * transaction.quantity
          : 0;
      const charges = transaction.fees;
      const brokerage = charges * 0.1;

      totalTrades++;
      totalPnl += pnl;
      totalCharges += charges;
      totalBrokerage += brokerage;

      const date = transaction.createdAt.toISOString().split("T")[0];
      const buyOrderPrice = isIOrder(transaction.buyOrder)
        ? transaction.buyOrder.price
        : 0;
      const sellOrderPrice = isIOrder(transaction.sellOrder)
        ? transaction.sellOrder.price
        : 0;

      let dailyTrade = tradeDetails.find((trade) => trade.date === date);
      if (!dailyTrade) {
        dailyTrade = {
          date,
          trades: 0,
          overallPL: 0,
          netPL: 0,
          status: transaction.status,
          details: [],
        };
        tradeDetails.push(dailyTrade);
      }

      dailyTrade.trades++;
      dailyTrade.overallPL += pnl;
      dailyTrade.netPL += pnl - charges - brokerage;
      dailyTrade.details.push({
        time: transaction.createdAt.toLocaleTimeString(),
        type: transaction.type,
        symbol: (transaction.stock as any)?.symbol ?? "Unknown",
        quantity: transaction.quantity,
        entry: buyOrderPrice,
        exit: sellOrderPrice,
        pnl,
        notes: "Example trade note",
      });
    });

    const winTrades = transactions.filter((transaction: ITransaction) => {
      const buyOrderPrice = isIOrder(transaction.buyOrder)
        ? transaction.buyOrder.price
        : 0;
      const sellOrderPrice = isIOrder(transaction.sellOrder)
        ? transaction.sellOrder.price
        : 0;
      return transaction.type === "BUY" && sellOrderPrice > buyOrderPrice;
    }).length;

    const lossTrades = totalTrades - winTrades;
    const winRate = (winTrades / totalTrades) * 100;
    const averageWin = winTrades ? totalPnl / winTrades : 0;
    const averageLoss = lossTrades ? totalPnl / lossTrades : 0;

    return {
      winRate,
      averageWin,
      averageLoss,
      overallPL: totalPnl,
      netPL: totalPnl - totalCharges - totalBrokerage,
      totalTrades,
      charges: totalCharges,
      brokerage: totalBrokerage,
      trades: tradeDetails,
    };
  }

  async getActiveSessions(): Promise<SessionDto[] | null> {
    try {
      const sessionData = await this.sessionRepository.getActiveSessions();
      return sessionData ? sessionData.map((s) => this.toSessionDto(s)) : null;
    } catch (error) {
      throw error;
    }
  }
  async getAssignedSession(
    instructorId: string | undefined
  ): Promise<SessionDto[] | null> {
    try {
      const instructorData = await this.userRepository.findById(instructorId);
      const email = instructorData?.email || undefined;
      console.log(email);
      const sessionData = await this.sessionRepository.getAssigned(email);
      console.log(sessionData);
      return sessionData ? sessionData.map((s) => this.toSessionDto(s)) : null;
    } catch (error) {
      throw error;
    }
  }
  async getPurchased(userId: string | undefined): Promise<SessionDto[] | null> {
    try {
      const sessionData = await this.sessionRepository.getPurchased(userId);
      return sessionData ? sessionData.map((s) => this.toSessionDto(s)) : null;
    } catch (error) {
      throw error;
    }
  }
  async getBySearch(query: Partial<StockDto>): Promise<StockDto[]> {
    const results = await this.stockRepository.searchStocks(query as any);
    return results.map((s) => this.toStockDto(s));
  }
  async countOrders(userId: string | undefined): Promise<number> {
    return await this.orderRepository.countOrdersByUser(userId);
  }
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as jwt.JwtPayload;

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        return "no user";
      }

      // Generate a new access token
      const newToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
      });

      return newToken;
    } catch (error) {
      return "Failed to verify refresh token.";
    }
  }
  async getNotifications(
    userId: string | undefined
  ): Promise<NotificationDto[] | null> {
    const notifications = await this.notificationRepository.getNotifications(
      userId
    );
    return notifications
      ? notifications.map((n) => this.toNotificationDto(n))
      : null;
  }
}
