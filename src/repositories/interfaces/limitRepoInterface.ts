import { ILimit } from "../../models/interfaces/limitInterface";

export interface ILimitRepository {
  updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
}
