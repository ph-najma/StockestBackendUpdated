import User from "../models/userModel";
import { IUser } from "../models/interfaces/userInterface";
import { IuserRepsitory } from "./interfaces/userRepoInterface";
import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
export class UserRepository
  extends BaseRepository<IUser>
  implements IuserRepsitory
{
  constructor() {
    super(User); // Pass the User model to the base repository
  }
  // Find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  // Find user by OTP
  async findByOtp(otp: string): Promise<IUser | null> {
    return User.findOne({ otp });
  }
  //Find by ID

  async findById(
    userId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IUser | null> {
    return await User.findById(userId).populate({
      path: "portfolio.stockId",
      model: "Stock",
    });
  }

  // Save a new user
  async save(userData: Partial<IUser>): Promise<IUser> {
    console.log(userData);
    const user = new User(userData);
    return user.save();
  }

  // Update user data
  async updateById(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  // Update user password
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
  }
  // Find or create Google user
  async findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser> {
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User(userData);
      await user.save();
    }
    return user;
  }
  //Find an admin by email

  async findAdminByEmail(email: string): Promise<IUser | null> {
    return super.findOne({ email, is_Admin: true });
  }

  //Find all users

  async findAllUsers(): Promise<IUser[]> {
    return super.findAll({ is_Admin: false });
  }

  //Save a user
  async saveUser(user: IUser): Promise<IUser> {
    return user.save();
  }
  // Fetch user by ID

  // async updatePortfolio(
  //   userId: string,
  //   portfolioData: { stockId: string; quantity: number }
  // ): Promise<IUser | null> {
  //   return await this.model.findByIdAndUpdate(
  //     userId,
  //     { $push: { portfolio: portfolioData } },
  //     { new: true }
  //   );
  // }
  // Fetch user balance
  async getUserBalance(userId: string): Promise<number | null> {
    const user = await this.model.findById(userId);
    return user?.balance || null;
  }
  // Update user balance
  async updateUserBalance(
    userId: string | undefined,
    amount: number
  ): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );
  }
  async addSignupBonus(userId: string, type: string): Promise<IUser | null> {
    const user = await User.findById(userId);
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
    const user = await this.model.findById(userId);

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
    return await User.findOne({ referralCode: refferalcode });
  }
  async getPromotions(userId: string | undefined): Promise<IUser | null> {
    const user = await User.findById(userId).exec();
    return user;
  }
  async countUser(): Promise<number> {
    return await User.countDocuments({ is_Admin: false }).exec();
  }
}
