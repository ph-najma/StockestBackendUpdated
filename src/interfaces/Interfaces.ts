export interface ISignupBonus {
  enabled: boolean;
  amount: number;
  minimumDepositRequired: number;
  expiryDays: number;
}

export interface IReferralBonus {
  enabled: boolean;
  referrerAmount: number;
  refereeAmount: number;
  maxReferralsPerUser: number;
  minimumDepositRequired: number;
}

export interface ILoyaltyRewards {
  enabled: boolean;
  tradingAmount: number;
  rewardAmount: number;
  timeframeInDays: number;
}

// Define the Promotion schema interface

export interface ITradeDetail {
  time: string;
  type: string;
  symbol: string;
  quantity: number;
  entry: number;
  exit: number;
  pnl: number;
  notes: string;
}

export interface IDailyTrade {
  date: string;
  trades: number;
  overallPL: number;
  netPL: number;
  status: string;
  details: ITradeDetail[];
}

export interface ITradeDiary {
  winRate: number;
  averageWin: number;
  averageLoss: number;
  overallPL: number;
  netPL: number;
  totalTrades: number;
  charges: number;
  brokerage: number;
  trades: IDailyTrade[];
}

export interface ResponseModel<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// Service/Controller DTOs (decoupled from persistence models)
export interface UserDto {
  id: string;
  name: string;
  email: string;
  balance: number;
  role?: string;
}

export interface StockDto {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  stock: StockDto | string;
  type: string;
  orderType: string;
  quantity: number;
  price?: number;
  status: string;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  amount: number;
  type: string;
  createdAt: string;
}

export interface WatchlistItemDto {
  id: string;
  symbol: string;
}

export interface PromotionDto {
  id: string;
  title: string;
  description?: string;
}

export interface SessionDto {
  id: string;
  title: string;
  instructorId: string;
  scheduledAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
}
export interface ILimitOrderQuery {
  orderType: string;
  status?: string | undefined;
  user?: { $regex: RegExp };
  createdAt?: { $gte: Date; $lte: Date };
}

export interface OtpStoreEntry {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  role?: string;
  otpExpiration?: number;
  userId?: string;
  refferedBy?: string;
}
export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IAdminDashboardSummary {
  totalUsers: number;
  completed?: number;
  canceled?: number;
  tradingVolume: number;
  totalProfitLoss: number;
  feeCollection: number;
}
