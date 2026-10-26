import { OrderType } from '../entities/order.entity';
import { DispatchItem } from '../../kds/order-dispatcher.service';

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly tenantId: string,
    public readonly shiftId: string | null,
    public readonly waiterId: string | null,
    public readonly waiterName: string,
    public readonly orderType: OrderType,
    public readonly tableNumber: string | null,
    public readonly items: DispatchItem[],
    public readonly totalAmount: number,
    public readonly createdAt: Date,
  ) {}
}
