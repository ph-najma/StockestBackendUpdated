import { Request, Response } from "express";
export interface IpaymentController {
  createOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
}
