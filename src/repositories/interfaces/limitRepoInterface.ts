import { ILimit } from "../../interfaces/modelInterface";

export interface ILimitRepository {
  updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
}
