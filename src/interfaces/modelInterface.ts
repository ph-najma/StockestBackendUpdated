import mongoose, { Types, FilterQuery, UpdateQuery, Document } from "mongoose";

export interface IBaseRepository<T> {
  // Find by ID
  findById(id: string | undefined): Promise<T | null>;

  // Find one
  findOne(filter: FilterQuery<T>): Promise<T | null>;

  // Find all
  findAll(filter?: FilterQuery<T>): Promise<T[]>;

  // Create
  create(data: Partial<T>): Promise<T>;

  // Update by ID
  updateById(
    id: string | undefined,
    updateData: UpdateQuery<T>
  ): Promise<T | null>;

  // Delete by ID
  deleteById(id: string): Promise<T | null>;
}

type ObjectId = mongoose.Types.ObjectId;
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string | undefined;
  email: string | undefined;
  password?: string | undefined;
  createdAt: Date;
  is_Blocked: boolean;
  role: "user" | "admin";
  is_Admin: boolean;
  is_instructor: boolean;
  googleId?: string;
  profilePhoto?: string;
  portfolio: { stockId: IStock["_id"]; quantity: number }[];
  comparePassword(password: string): Promise<boolean>;
  balance: number;
  referralCode?: string;
  referredBy?: string;
  referralsCount: number;
  refreshToken: string;
  isEligibleForSignupBonus: boolean;
  isEligibleForReferralBonus: boolean;
  isEligibleForLoyaltyRewards: boolean;
  checkLoyaltyRewards(): Promise<void>;
}
export interface IWatchlist extends Document {
  user: IUser["_id"];
  stocks: { symbol: string; addedAt: Date }[];
  name: string;
  createdAt: Date;
}
export interface ITransaction extends Document {
  buyer: IUser["_id"];
  seller: IUser["_id"];
  buyOrder: IOrder["_id"] | IOrder;
  sellOrder: IOrder["_id"] | IOrder;
  stock: IStock["_id"] | IStock;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  paymentMethod?: "PAYPAL" | "CREDIT_CARD" | "BANK_TRANSFER";
  paymentReference?: string;
  createdAt: Date;
  completedAt?: Date;
}
export interface IStock extends Document {
  _id: Types.ObjectId;
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number;
  change: number;
  changePercent: string;
  latestTradingDay: string;
  adjustedVolume: number;
}
export interface ISession extends Document {
  student_id: IUser["_id"] | null;
  instructor_name: string;
  instructorId: string;
  instructor_email: string;
  specialization: string;
  hourly_rate: number;
  start_time: Date;
  end_time: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  created_at: Date;
  updated_at: Date;
  connection_status: "CONNECTED" | "DISCONNECTED" | "NOT CONNECTED";
}
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
export interface IPromotion extends Document {
  signupBonus: ISignupBonus;
  referralBonus: IReferralBonus;
  loyaltyRewards: ILoyaltyRewards;
}
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  stock: IStock["_id"] | string | mongoose.Types.ObjectId;
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP";
  quantity: number;
  price: number;
  stopPrice?: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  completedAt?: Date;
  isIntraday: Boolean;
  orderId?: string;
}
export interface ILimit extends Document {
  maxBuyLimit: number;
  maxSellLimit: number;
  timeframeInHours: number;
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
