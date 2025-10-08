import mongoose, { Types, Document } from "mongoose";
import { IUser } from "./userInterface";
import { IStock } from "./stockInterface";
export interface IWatchlist extends Document {
  user: IUser["_id"];
  stocks: { symbol: string; addedAt: Date }[];
  name: string;
  createdAt: Date;
}
