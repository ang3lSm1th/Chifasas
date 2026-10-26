import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

export type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'CARD';
export type ReceiptType = 'TICKET' | 'BOLETA' | 'FACTURA';

@Entity('payments')
@Index(['tenantId', 'shiftId'])
@Index(['tenantId', 'orderId'])
@Index(['tenantId', 'paidAt'])
export class Payment {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'shift_id', type: 'bigint' })
  shiftId: string;

  @Column({ name: 'order_id', type: 'varchar', length: 36 })
  orderId: string;

  @Column({ name: 'cashier_id', type: 'varchar', length: 36, nullable: true })
  cashierId: string | null;

  @Column({ name: 'receipt_number', type: 'varchar', length: 40 })
  receiptNumber: string;

  @Column({ name: 'receipt_type', type: 'varchar', length: 20, default: 'TICKET' })
  receiptType: ReceiptType;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, default: 'CASH' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  amount: number;

  @Column({ name: 'cash_received', type: 'decimal', precision: 12, scale: 2, nullable: true })
  cashReceived: number | null;

  @Column({ name: 'change_given', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  changeGiven: number;

  @Column({ name: 'operation_code', type: 'varchar', length: 60, nullable: true })
  operationCode: string | null;

  @Column({ name: 'customer_document', type: 'varchar', length: 25, nullable: true })
  customerDocument: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 150, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @Column({ name: 'paid_at', type: 'datetime' })
  paidAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User | null;
}
