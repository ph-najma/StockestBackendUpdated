import { ILimit } from "../../interfaces/modelInterface";
import mongoose, { FilterQuery, UpdateQuery } from "mongoose";
export interface IBaseRepository<T> {
  findById(id: string | undefined): Promise<T | null>;

  findOne(filter: FilterQuery<T>): Promise<T | null>;

  findAll(filter?: FilterQuery<T>): Promise<T[]>;

  create(data: Partial<T>): Promise<T>;

  updateById(
    id: string | undefined,
    updateData: UpdateQuery<T>
  ): Promise<T | null>;

  deleteById(id: string): Promise<T | null>;
}

export interface ILimitRepository {
  updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
}
