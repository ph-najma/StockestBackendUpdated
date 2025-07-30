import Promotion from "../models/promoModel";
import { IpromotionRepsoitory } from "./interfaces/promotionRepoInterface";

import { IPromotion } from "../models/interfaces/promotionInterface";
export class PromotionRepository implements IpromotionRepsoitory {
  async createPromotion(data: IPromotion): Promise<IPromotion | null> {
    const updatedPromotion = await Promotion.findOneAndUpdate(
      {},
      { $set: data },
      { new: true }
    );
    return updatedPromotion;
  }
  async findPromotion(): Promise<IPromotion | null> {
    return await Promotion.findOne();
  }
}
