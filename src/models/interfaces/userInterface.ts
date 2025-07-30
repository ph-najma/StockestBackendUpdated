import mongoose, { Types, Document } from "mongoose";
import { IStock } from "./stockInterface";
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
