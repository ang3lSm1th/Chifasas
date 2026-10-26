import { IsIn, IsString } from 'class-validator';
import type { OrderStatus } from '../entities/order.entity';
import type { OrderItemKdsStatus } from '../entities/order-item.entity';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['PENDING', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'])
  status: OrderStatus;
}

export class UpdateOrderItemStatusDto {
  @IsString()
  @IsIn(['PENDING', 'PREPARING', 'READY', 'SERVED'])
  kdsStatus: OrderItemKdsStatus;
}
