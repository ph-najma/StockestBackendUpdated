import { ISession } from "../models/interfaces/sessionInterface";
import { IPaymentService } from "../interfaces/serviceInterface";

import { IuserRepsitory } from "../repositories/interfaces/userRepoInterface";
import { ISessionRepository } from "../repositories/interfaces/sessionRepoInterface";
import { IPaymentRepository } from "../repositories/interfaces/paymentRepo";
export class PaymentService implements IPaymentService {
  private paymentRepository: IPaymentRepository;
  private userRepository: IuserRepsitory;
  private sessionRepository: ISessionRepository;
  constructor(
    paymentRepository: IPaymentRepository,
    userRepository: IuserRepsitory,
    sessionRepository: ISessionRepository
  ) {
    this.paymentRepository = paymentRepository;
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
  }

  async createOrder(
    userId: string | undefined,
    amount: number
  ): Promise<Razorpay.Order> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    return this.paymentRepository.createOrder(amount);
  }

  async verifyPayment(
    userId: string | undefined,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    console.log("helo from payment service", userId);
    const isVerified = this.paymentRepository.verifyPaymentSignature(
      orderId,
      paymentId,
      signature
    );

    const amount = 100;
    const updatedUser = await this.userRepository.updateUserBalance(
      userId,
      amount
    );

    if (!updatedUser) {
      console.log("not updated");
      throw new Error("Failed to update user balance");
    }

    return true;
  }
  async updateSession(
    sessionId: string,
    userId: string | undefined
  ): Promise<ISession | null> {
    const updateddata = await this.sessionRepository.assignStudent(
      sessionId,
      userId
    );
    return updateddata;
  }
}
