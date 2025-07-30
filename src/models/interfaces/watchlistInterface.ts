import mongoose, { Types, Document } from "mongoose";
import { IUser } from "./userInterface";
export interface IWatchlist extends Document {
  user: IUser["_id"];
  stocks: { symbol: string; addedAt: Date }[];
  name: string;
  createdAt: Date;
}
