import { IUser } from "../../models/interfaces/userInterface";
import { IStock } from "../../models/interfaces/stockInterface";
import { IOrder } from "../../models/interfaces/orderInterface";
import { ITransaction } from "../../models/interfaces/transactionInterface";
import { IWatchlist } from "../../models/interfaces/watchlistInterface";
import { IPromotion } from "../../models/interfaces/promotionInterface";
import { ISession } from "../../models/interfaces/sessionInterface";
import { INotification } from "../../models/interfaces/notificationInterface";
import { ObjectId, Types } from "mongoose";

export interface IUserService {
  signup(
    name: string,
    email: string,
    password: string,
    role: string,
    referralCode?: string
  ): Promise<void>;
  verifyOtp(otp: string): Promise<{ token: string }>;
  resendOtp(email: string): Promise<string>;
  login(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string; user: IUser }>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  home(): Promise<void>;
  getUserProfile(userId: string | undefined): Promise<IUser | null>;
  getUserPortfolio(userId: string | undefined): Promise<IUser | null>;
  getAllStocks(): Promise<IStock[]>;
  getStockById(userId: string | undefined): Promise<IStock | null>;
  placeOrder(
    user: Types.ObjectId | undefined,
    stock: string,
    type: string,
    orderType: string,
    quantity: number,
    price: number,
    stopPrice: number,
    IsIntraday: Boolean | undefined
  ): Promise<IOrder | null>;
  getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<ITransaction[]>;
  getUpdatedPortfolio(user: IUser): Promise<any>;
  updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null>;
  getMarketPrice(symbol: string): Promise<any>;
  getWatchlist(userId: string | undefined): Promise<any>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<IWatchlist>;
  getStockData(symbol: string | undefined): Promise<any>;
  getReferralCode(userId: string | undefined): Promise<string | undefined>;
  checkPortfolio(
    userId: string,
    stockId: string,
    quantity: number,
    type: "BUY" | "SELL"
  ): Promise<{ success: boolean; message: string }>;
  getOrders(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<IOrder[] | null>;
  getUserProfileWithRewards(
    userId: string | undefined
  ): Promise<IPromotion | null>;
  getTradeDiary(userId: string | undefined): Promise<any>;
  getActiveSessions(): Promise<ISession[] | null>;
  getAssignedSession(
    instructorId: string | undefined
  ): Promise<ISession[] | null>;
  getPurchased(userId: string | undefined): Promise<ISession[] | null>;
  getBySearch(query: Partial<IStock>): Promise<IStock[]>;
  getHistorical(symbol: string | undefined): Promise<any>;
  countOrders(userId: string | undefined): Promise<number>;
  refreshToken(refreshToken: string): Promise<string>;
  getNotifications(userId: string | undefined): Promise<INotification[] | null>;
  handleGoogleLogin(profile: any): Promise<IUser>;
}
