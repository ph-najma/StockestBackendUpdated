import { Request, Response } from "express";

import { IpaymentController } from "./interfaces/paymentControllerInterface";
import { IPaymentService } from "../services/interfaces/paymentServiceInterface";
export class PaymentController implements IpaymentController {
  private paymentService: IPaymentService;

  constructor(paymentService: IPaymentService) {
    this.paymentService = paymentService;
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { amount } = req.body;

      console.log(req.body);
      const order = await this.paymentService.createOrder(userId, amount);

      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      console.log(userId, "from controller");
      const { orderId, paymentId, signature, course_id, isCourse } = req.body;
      const isVerified = await this.paymentService.verifyPayment(
        userId,
        orderId,
        paymentId,
        signature
      );
      if (isCourse) {
        const updateSession = await this.paymentService.updateSession(
          course_id,
          userId
        );
      }

      if (isVerified) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
