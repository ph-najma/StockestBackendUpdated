import { ISession } from "../../models/interfaces/sessionInterface";
export interface IPaymentService {
  createOrder(
    userId: string | undefined,
    amount: number
  ): Promise<Razorpay.Order>;
  verifyPayment(
    userId: string | undefined,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean>;
  updateSession(
    sessionId: string,
    userId: string | undefined
  ): Promise<ISession | null>;
}
