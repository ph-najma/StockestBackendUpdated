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
