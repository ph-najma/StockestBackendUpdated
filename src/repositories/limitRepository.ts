import { ILimitRepository } from "./interfaces/baseRepoInterface";
import { ILimit } from "../models/interfaces/limitInterface";
import { Model } from "mongoose";

export class limitRepository implements ILimitRepository {
  constructor(private limitModel: Model<ILimit>) {}
  async updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null> {
    try {
      const limit = await this.limitModel
        .findOneAndUpdate({}, limitData, {
          new: true,
          upsert: true,
        })
        .exec();

      return limit;
    } catch (error: any) {
      throw new Error(`Failed to update limits: ${error.message}`);
    }
  }
  async getLimits(): Promise<ILimit | null> {
    const limit = await this.limitModel.findOne();
    return limit;
  }
}
