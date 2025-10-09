import {
  UserDto,
  StockDto,
  OrderDto,
  TransactionDto,
  WatchlistItemDto,
  PromotionDto,
  SessionDto,
  NotificationDto,
} from "../../interfaces/Interfaces";
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
  ): Promise<{ token: string; refreshToken: string; user: UserDto }>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  home(): Promise<void>;
  getUserProfile(userId: string | undefined): Promise<UserDto | null>;
  getUserPortfolio(userId: string | undefined): Promise<UserDto | null>;
  getAllStocks(): Promise<StockDto[]>;
  getStockById(userId: string | undefined): Promise<StockDto | null>;
  placeOrder(
    user: Types.ObjectId | undefined,
    stock: string,
    type: string,
    orderType: string,
    quantity: number,
    price: number,
    stopPrice: number,
    IsIntraday: Boolean | undefined
  ): Promise<OrderDto | null>;
  getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<TransactionDto[]>;
  getUpdatedPortfolio(user: UserDto): Promise<any>;
  updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<UserDto | null>;
  getMarketPrice(symbol: string): Promise<any>;
  getWatchlist(userId: string | undefined): Promise<WatchlistItemDto[]>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<WatchlistItemDto>;
  getStockData(symbol: string | undefined): Promise<StockDto | null>;
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
  ): Promise<OrderDto[] | null>;
  getUserProfileWithRewards(
    userId: string | undefined
  ): Promise<PromotionDto | null>;
  getTradeDiary(userId: string | undefined): Promise<any>;
  getActiveSessions(): Promise<SessionDto[] | null>;
  getAssignedSession(
    instructorId: string | undefined
  ): Promise<SessionDto[] | null>;
  getPurchased(userId: string | undefined): Promise<SessionDto[] | null>;
  getBySearch(query: Partial<StockDto>): Promise<StockDto[]>;
  getHistorical(symbol: string | undefined): Promise<any>;
  countOrders(userId: string | undefined): Promise<number>;
  refreshToken(refreshToken: string): Promise<string>;
  getNotifications(
    userId: string | undefined
  ): Promise<NotificationDto[] | null>;
  handleGoogleLogin(profile: any): Promise<UserDto>;
  getMoneyDetails(userId: string | undefined): Promise<any>;
  RemoveStockFromWathclist(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<WatchlistItemDto | null>;
  getAuthParams(): Promise<any>;
  uploadImage(fileBuffer: Buffer, fileName: string): Promise<any>;
  updateProfilePhoto(
    userId: string | undefined,
    profileImageUrl: string
  ): Promise<UserDto | null>;
}
