import { ITransaction } from "../../models/interfaces/transactionInterface";
export interface ITransactionRepository {
  getTransactions(
    userId: string | undefined,
    skip: number,
    limit: number
  ): Promise<ITransaction[]>;
  getAllTransactions(): Promise<ITransaction[]>;
  getFeeCollectionSummary(): Promise<number>;
  getTradeDiary(userId: string | undefined): Promise<any>;
}
