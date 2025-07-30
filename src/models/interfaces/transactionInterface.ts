import mongoose, { Types, Document } from "mongoose";

import { IUser } from "./userInterface";
import { IOrder } from "./orderInterface";
import { IStock } from "./stockInterface";
export interface ITransaction extends Document {
  buyer: IUser["_id"];
  seller: IUser["_id"];
  buyOrder: IOrder["_id"] | IOrder;
  sellOrder: IOrder["_id"] | IOrder;
  stock: IStock["_id"] | IStock;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  paymentMethod?: "PAYPAL" | "CREDIT_CARD" | "BANK_TRANSFER";
  paymentReference?: string;
  createdAt: Date;
  completedAt?: Date;
}
