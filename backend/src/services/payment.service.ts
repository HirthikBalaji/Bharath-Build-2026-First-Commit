export interface PaymentResult {
  success: boolean;
  paymentId: string;
  referenceId: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  referenceId: string;
  amount: number;
  status: 'INITIATED' | 'COMPLETED';
  timestamp: string;
}

export class MockPaymentService {
  /**
   * Process simulated buyer payment (replaceable by Razorpay, Stripe, etc.)
   */
  static async processPayment(
    amount: number,
    paymentMethod: string = 'UPI/Card',
    simulateFailure: boolean = false
  ): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (simulateFailure) {
      throw new Error('Payment processing failed. Transaction declined by bank.');
    }

    const ref = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      paymentId: `pid_${Math.random().toString(36).substring(2, 11)}`,
      referenceId: ref,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Release funds back to original passenger (seller refund)
   */
  static async processRefund(
    amount: number,
    sellerId: string,
    simulateFailure: boolean = false
  ): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    if (simulateFailure) {
      throw new Error('Refund processing failed.');
    }

    const ref = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      refundId: `rf_${Math.random().toString(36).substring(2, 11)}`,
      referenceId: ref,
      amount,
      status: 'INITIATED',
      timestamp: new Date().toISOString()
    };
  }
}
