import { IUser } from "../../models/interfaces/userInterface";
import mongoose, { FilterQuery, UpdateQuery } from "mongoose";
export interface IuserRepsitory {
  findByEmail(email: string): Promise<IUser | null>;
  findByOtp(otp: string): Promise<IUser | null>;
  findById(
    userId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IUser | null>;
  save(userData: Partial<IUser>): Promise<IUser>;
  updateById(userId: string, updateData: Partial<IUser>): Promise<IUser | null>;
  updatePassword(email: string, newPassword: string): Promise<void>;
  findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser>;
  findAdminByEmail(email: string): Promise<IUser | null>;
  findAllUsers(): Promise<IUser[]>;
  saveUser(user: IUser): Promise<IUser>;

  getUserBalance(userId: string): Promise<number | null>;
  updateUserBalance(
    userId: string | undefined,
    amount: number
  ): Promise<IUser | null>;
  updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null>;
  addSignupBonus(userId: string, type: string): Promise<IUser | null>;
  findByRefferalCode(refferalcode: string): Promise<IUser | null>;
  getPromotions(userId: string | undefined): Promise<IUser | null>;
  countUser(): Promise<number>;
}
