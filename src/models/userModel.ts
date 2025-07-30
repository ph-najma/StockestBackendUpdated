import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

import { IUser } from "./interfaces/userInterface";
import { IPromotion } from "./interfaces/promotionInterface";

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  is_Blocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  is_Admin: {
    type: Boolean,
    default: false,
  },
  is_instructor: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profilePhoto: {
    type: String,
  },
  portfolio: [
    {
      stockId: { type: Schema.Types.ObjectId, ref: "Stock" },
      quantity: { type: Number, required: true },
    },
  ],
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  isEligibleForSignupBonus: {
    type: Boolean,
    default: false,
  },
  isEligibleForReferralBonus: {
    type: Boolean,
    default: false,
  },
  isEligibleForLoyaltyRewards: {
    type: Boolean,
    default: false,
  },
  referralCode: { type: String, unique: true },
  referredBy: { type: String },
  referralsCount: { type: Number, default: 0 },
  refreshToken: { type: String },
});

// Pre-save hook to hash the password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password as string);
};
// Method to check for  rewards based on promotions
userSchema.methods.checkLoyaltyRewards = async function (): Promise<void> {
  const user = this;

  for (const promotionId of user.promotions) {
    const promotion = await mongoose
      .model<IPromotion>("Promotion")
      .findById(promotionId);

    if (promotion) {
      if (promotion.signupBonus.enabled && user.isEligibleForSignupBonus) {
        if (user.balance >= promotion.signupBonus.minimumDepositRequired) {
          user.balance += promotion.signupBonus.amount;
          console.log("Signup bonus applied:", user.balance);
        }
      }

      if (promotion.referralBonus.enabled && user.isEligibleForReferralBonus) {
        user.balance += 100;

        console.log("Referral bonus applied:", user.balance);
      }

      if (promotion.loyaltyRewards.enabled) {
        if (user.balance >= promotion.loyaltyRewards.tradingAmount) {
          user.balance += promotion.loyaltyRewards.rewardAmount;
          console.log("Loyalty rewards applied:", user.balance);
        }
      }
    }
  }

  await user.save();
};

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);
export default User;
