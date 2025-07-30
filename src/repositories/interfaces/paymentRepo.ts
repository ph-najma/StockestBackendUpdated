export interface IPaymentRepository {
  createOrder(amount: number): Promise<Razorpay.Order>;
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;
}
