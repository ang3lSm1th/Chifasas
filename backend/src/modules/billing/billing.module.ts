import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { AuthModule } from '../auth/auth.module';
import { ShiftsModule } from '../shifts/shifts.module';
import { KdsModule } from '../kds/kds.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, OrderItem, Shift]),
    AuthModule,
    ShiftsModule,
    KdsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
