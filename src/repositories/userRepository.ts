import { IUser } from "../models/interfaces/userInterface";
import { IuserRepsitory } from "./interfaces/userRepoInterface";
import mongoose, { ObjectId } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { Model, Types } from "mongoose";
export class UserRepository
  extends BaseRepository<IUser>
  implements IuserRepsitory
{
  constructor(private userModel: Model<IUser>) {
    super(userModel);
  }
  // Find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  // Find user by OTP
  async findByOtp(otp: string): Promise<IUser | null> {
    return this.userModel.findOne({ otp }).exec();
  }
  //Find by ID

  async findById(
    userId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IUser | null> {
    return await this.userModel
      .findById(userId)
      .populate({
        path: "portfolio.stockId",
        model: "Stock",
      })
      .exec();
  }

  // Save a new user
  async save(userData: Partial<IUser>): Promise<IUser> {
    console.log(userData);
    const user = new this.userModel(userData);
    return user.save();
  }

  async findUserByGoogleId(googleId: string): Promise<IUser | null> {
    return (await this.userModel.findOne({ googleId })) as IUser | null;
  }
  

  // Update user data
  async updateById(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
  }

  // Update user password
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
  }
  async findByIdWithPortfolio(userId: string): Promise<IUser | null> {
    return this.userModel.findById(userId).populate("portfolio.stockId");
  }
  // Find or create Google user
  async findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser> {
    let user = await this.userModel.findOne({ googleId });
    if (!user) {
      user = new this.userModel(userData);
      await user.save();
    }
    return user;
  }
  //Find an admin by email

  async findAdminByEmail(email: string): Promise<IUser | null> {
    return this.userModel.findOne({ email, is_Admin: true });
  }

  //Find all users

  async findAllUsers(): Promise<IUser[]> {
    return this.userModel.find({ is_Admin: false }).exec();
  }

  //Save a user
  async saveUser(user: IUser): Promise<IUser> {
    return user.save();
  }

  // Fetch user balance
  async getUserBalance(userId: string): Promise<number | null> {
    const user = await this.userModel.findById(userId);
    return user?.balance || null;
  }
  // Update user balance
  async updateUserBalance(
    userId: string | undefined,
    amount: number
  ): Promise<IUser | null> {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );
  }
  async addSignupBonus(userId: string, type: string): Promise<IUser | null> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (type == "signup") {
      user.isEligibleForSignupBonus = true;
    } else {
      user.isEligibleForReferralBonus = true;
    }
    await user.save();
    return user;
  }
  async updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null> {
    const user = await this.userModel.findById(userId);

    if (!user) throw new Error("User not found");

    // Check if the stock exists in the portfolio
    const stockIdObject = new mongoose.Types.ObjectId(stockId);
    const stockIndex = user.portfolio.findIndex(
      (item) => item.stockId.toString() === stockIdObject.toString()
    );

    if (stockIndex === -1) {
      throw new Error("Stock not found in portfolio");
    }

    const stockInPortfolio = user.portfolio[stockIndex];

    if (stockInPortfolio.quantity < quantityToSell) {
      throw new Error("Not enough stock to sell");
    }

    if (stockInPortfolio.quantity === quantityToSell) {
      user.portfolio.splice(stockIndex, 1);
    } else {
      stockInPortfolio.quantity -= quantityToSell;
    }

    return await user.save();
  }
  async findByRefferalCode(refferalcode: string): Promise<IUser | null> {
    return await this.userModel.findOne({ referralCode: refferalcode });
  }
  async getPromotions(userId: string | undefined): Promise<IUser | null> {
    const user = await this.userModel.findById(userId).exec();
    return user;
  }
  async countUser(): Promise<number> {
    return await this.userModel.countDocuments({ is_Admin: false }).exec();
  }
  async updatePortfolio(
    userId: Types.ObjectId,
    stockId: string | ObjectId,
    isBuy: boolean,
    quantity: number
  ) {
    if (isBuy) {
      return this.userModel.findOneAndUpdate(
        { _id: userId, "portfolio.stockId": stockId },
        { $inc: { "portfolio.$.quantity": quantity } },
        { new: true, upsert: true }
      );
    } else {
      return this.userModel.findOneAndUpdate(
        { _id: userId, "portfolio.stockId": stockId },
        { $inc: { "portfolio.$.quantity": -quantity } },
        { new: true }
      );
    }
  }
}
