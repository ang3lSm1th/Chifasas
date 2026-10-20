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
import { User } from '../../users/entities/user.entity';

export type ShiftStatus = 'OPEN' | 'CLOSED';

@Entity('shifts')
@Index(['tenantId', 'status'])
export class Shift {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'tenant_id', length: 64 })
  tenantId: string;

  @Column({ name: 'opened_by_id', length: 36 })
  openedById: string;

  @Column({ name: 'closed_by_id', length: 36, nullable: true })
  closedById: string | null;

  @Column({ name: 'initial_cash', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  initialCash: number;

  @Column({ name: 'expected_cash', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  expectedCash: number;

  @Column({ name: 'declared_cash', type: 'decimal', precision: 12, scale: 2, nullable: true })
  declaredCash: number | null;

  @Column({ name: 'difference', type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number | null;

  @Column({ length: 20, default: 'OPEN' })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'opened_at', type: 'datetime' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'grace_expires_at', type: 'datetime', nullable: true })
  graceExpiresAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by_id' })
  openedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy: User | null;
}
