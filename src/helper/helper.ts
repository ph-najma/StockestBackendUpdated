import { Response } from "express";
import { IOrder } from "../models/interfaces/orderInterface";

import { HttpStatusCode } from "../interfaces/Interfaces";

export const sendResponse = <T>(
  res: Response,
  statusCode: HttpStatusCode,
  success: boolean,
  message: string,
  data: T | null = null,
  error: Error | null = null
) => {
  res.status(statusCode).json({ success, message, data, error });
};
export function isIOrder(order: any): order is IOrder {
  return order && typeof order.price === "number";
}
