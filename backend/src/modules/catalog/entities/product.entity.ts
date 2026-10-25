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
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { KdsStation } from '../../kds/entities/kds-station.entity';

@Entity('products')
@Index(['tenantId', 'isActive'])
@Index(['categoryId'])
@Index(['kdsStationId'])
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @Column({ name: 'subcategory_id', type: 'int', nullable: true })
  subcategoryId: number | null;

  @Column({ name: 'kds_station_id', type: 'varchar', length: 36, nullable: true })
  kdsStationId: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ name: 'is_beverage', type: 'tinyint', default: 0 })
  isBeverage: boolean;

  @Column({ name: 'current_stock', type: 'int', default: 0 })
  currentStock: number;

  @Column({ name: 'min_stock_alert', type: 'int', default: 5 })
  minStockAlert: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: boolean;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Subcategory, { nullable: true })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Subcategory | null;

  @ManyToOne(() => KdsStation, { nullable: true })
  @JoinColumn({ name: 'kds_station_id' })
  kdsStation: KdsStation | null;
}
