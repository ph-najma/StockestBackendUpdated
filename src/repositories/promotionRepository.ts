import { IpromotionRepsoitory } from "./interfaces/promotionRepoInterface";
import { IPromotion } from "../models/interfaces/promotionInterface";
import { Model } from "mongoose";
export class PromotionRepository implements IpromotionRepsoitory {
  constructor(private promotionModel: Model<IPromotion>) {}
  async createPromotion(data: IPromotion): Promise<IPromotion | null> {
    const updatedPromotion = await this.promotionModel.findOneAndUpdate(
      {},
      { $set: data },
      { new: true }
    );
    return updatedPromotion;
  }
  async findPromotion(): Promise<IPromotion | null> {
    return await this.promotionModel.findOne();
  }
}
