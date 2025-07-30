import { IPromotion } from "../../models/interfaces/promotionInterface";
export interface IpromotionRepsoitory {
  createPromotion(data: IPromotion): Promise<IPromotion | null>;
  findPromotion(): Promise<IPromotion | null>;
}
