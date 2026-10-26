import { PaymentMethod, ReceiptType } from '../entities/payment.entity';

export class OrderPaidEvent {
  constructor(
    public readonly paymentId: string,
    public readonly receiptNumber: string,
    public readonly tenantId: string,
    public readonly shiftId: string,
    public readonly orderId: string,
    public readonly cashierId: string | null,
    public readonly paymentMethod: PaymentMethod,
    public readonly receiptType: ReceiptType,
    public readonly amount: number,
    public readonly cashReceived: number,
    public readonly changeGiven: number,
    public readonly operationCode: string | null,
    public readonly paidAt: Date,
  ) {}
}
