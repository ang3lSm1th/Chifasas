import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Order } from './order.entity';
import { Product } from '../../catalog/entities/product.entity';
import { KdsStation } from '../../kds/entities/kds-station.entity';

export type OrderItemKdsStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

@Entity('order_items')
@Index(['tenantId', 'orderId'])
@Index(['tenantId', 'kdsStationId', 'kdsStatus'])
export class OrderItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'order_id', type: 'varchar', length: 36 })
  orderId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @Column({ name: 'kds_station_id', type: 'varchar', length: 36, nullable: true })
  kdsStationId: string | null;

  @Column({ name: 'product_name', type: 'varchar', length: 150 })
  productName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  subtotal: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @Column({ name: 'kds_status', type: 'varchar', length: 20, default: 'PENDING' })
  kdsStatus: OrderItemKdsStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => KdsStation, { nullable: true })
  @JoinColumn({ name: 'kds_station_id' })
  kdsStation: KdsStation | null;
}
