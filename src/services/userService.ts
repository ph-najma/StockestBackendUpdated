import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail";
import { generateOTP } from "../utils/otpGenerator";
import { OtpStoreEntry } from "../interfaces/Interfaces";
import {
  IWatchlistRepository,
  IuserRepsitory,
  ITransactionRepository,
  IStockRepository,
  ISessionRepository,
  IpromotionRepsoitory,
  IOrderRepository,
} from "../interfaces/repositoryInterface";
import {
  IWatchlist,
  IUser,
  ITransaction,
  IStock,
  ISession,
  IPromotion,
  IOrder,
} from "../interfaces/modelInterface";
import { IUserService } from "../interfaces/serviceInterface";

type ObjectId = mongoose.Types.ObjectId;

dotenv.config();

const otpStore: Map<string, OtpStoreEntry> = new Map();

export class UserService implements IUserService {
  private userRepository: IuserRepsitory;
  private orderRepository: IOrderRepository;
  private transactionRepository: ITransactionRepository;
  private stockRepository: IStockRepository;
  private promotionRepository: IpromotionRepsoitory;
  private watchlistRepository: IWatchlistRepository;
  private sessionRepository: ISessionRepository;

  constructor(
    stockRepository: IStockRepository,
    userRepository: IuserRepsitory,
    transactionRepository: ITransactionRepository,
    orderRepository: IOrderRepository,
    promotionRepository: IpromotionRepsoitory,
    watchlistRepsoitory: IWatchlistRepository,
    sessionRepository: ISessionRepository
  ) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.transactionRepository = transactionRepository;
    this.stockRepository = stockRepository;
    this.promotionRepository = promotionRepository;
    this.watchlistRepository = watchlistRepsoitory;
    this.sessionRepository = sessionRepository;
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
    await sendEmail(email, otp);
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

    await sendEmail(email, newOtp);

    return "OTP resent to email";
  }

  // Login user
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string; user: IUser }> {
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

    return { token, refreshToken, user };
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
    await sendEmail(email, otp);
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
  async getUserProfile(userId: string | undefined): Promise<IUser | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("user not found");
    }
    return user;
  }

  //Get User Portfolio
  async getUserPortfolio(userId: string | undefined): Promise<IUser | null> {
    return await this.userRepository.findById(userId);
  }

  async getUpdatedPortfolio(user: IUser): Promise<any> {
    let totalPortfolioValue = 0;
    let overallProfit = 0;
    let todaysProfit = 0;

    const updatedPortfolio = await Promise.all(
      user.portfolio.map(async (item) => {
        const stock = await this.getStockById(
          item.stockId instanceof mongoose.Types.ObjectId
            ? item.stockId.toString()
            : item.stockId
        );
        if (!stock) return item;

        const stockValue = stock.price * item.quantity;
        const profit = stockValue - stock.open * item.quantity;
        const todaysChange = stock.changePercent;

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
  async getAllStocks() {
    return this.stockRepository.getAllStocks();
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
  ): Promise<IOrder | null> {
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
    return order;
  }

  //Get Transactions of a user
  async getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<ITransaction[]> {
    const transactions = await this.transactionRepository.getTransactions(
      userId,
      skip,
      limit
    );

    return transactions;
  }
  //Get Stock By ID
  async getStockById(userId: string | undefined): Promise<IStock | null> {
    return await this.stockRepository.getStockById(userId);
  }

  async getWatchlist(userId: string | undefined): Promise<any> {
    return await this.watchlistRepository.getByUserId(userId);
  }

  //Update User Portfolio After Sell
  async updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null> {
    return await this.userRepository.updatePortfolioAfterSell(
      userId,
      stockId,
      quantityToSell
    );
  }
  async getMarketPrice(symbol: string): Promise<any> {
    return this.stockRepository.getMarketPrice(symbol);
  }
  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<IWatchlist> {
    return this.watchlistRepository.ensureWatchlistAndAddStock(
      userId,
      stocksymbol
    );
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
  ): Promise<IOrder[] | null> {
    const orders = await this.orderRepository.findOrders(userId, skip, limit);
    return orders;
  }
  async getUserProfileWithRewards(
    userId: string | undefined
  ): Promise<IPromotion | null> {
    try {
      const promo = await this.promotionRepository.findPromotion();

      return promo;
    } catch (error) {
      throw error;
    }
  }
  async getTradeDiary(userId: string | undefined): Promise<any> {
    try {
      const tradeData = await this.transactionRepository.getTradeDiary(userId);
      return tradeData;
    } catch (error) {
      throw error;
    }
  }
  async getActiveSessions(): Promise<ISession[] | null> {
    try {
      const sessionData = await this.sessionRepository.getActiveSessions();
      return sessionData;
    } catch (error) {
      throw error;
    }
  }
  async getAssignedSession(
    instructorId: string | undefined
  ): Promise<ISession[] | null> {
    try {
      const instructorData = await this.getUserProfile(instructorId);
      const email = instructorData?.email;
      console.log(email);
      const sessionData = await this.sessionRepository.getAssigned(email);
      console.log(sessionData);
      return sessionData;
    } catch (error) {
      throw error;
    }
  }
  async getPurchased(userId: string | undefined): Promise<ISession[] | null> {
    try {
      const sessionData = await this.sessionRepository.getPurchased(userId);
      return sessionData;
    } catch (error) {
      throw error;
    }
  }
  async getBySearch(query: Partial<IStock>): Promise<IStock[]> {
    return await this.stockRepository.searchStocks(query);
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
}
