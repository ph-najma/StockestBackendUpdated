export interface IPromotion extends Document {
  signupBonus: ISignupBonus;
  referralBonus: IReferralBonus;
  loyaltyRewards: ILoyaltyRewards;
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