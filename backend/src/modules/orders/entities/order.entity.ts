import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';

@Entity('orders')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'shiftId'])
@Index(['tenantId', 'tableNumber'])
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'shift_id', type: 'bigint', nullable: true })
  shiftId: string | null;

  @Column({ name: 'waiter_id', type: 'varchar', length: 36, nullable: true })
  waiterId: string | null;

  @Column({ name: 'order_number', type: 'varchar', length: 30 })
  orderNumber: string;

  @Column({ name: 'order_type', type: 'varchar', length: 20, default: 'DINE_IN' })
  orderType: OrderType;

  @Column({ name: 'table_number', type: 'varchar', length: 50, nullable: true })
  tableNumber: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 150, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: OrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'waiter_id' })
  waiter: User | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
