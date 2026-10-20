import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64, nullable: true })
  tenantId?: string;

  @Column({ name: 'username_or_ip', type: 'varchar', length: 150 })
  usernameOrIp: string;

  @Column({ type: 'boolean' })
  successful: boolean;

  @Column({ name: 'ip_address', type: 'varchar', length: 64 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'attempted_at' })
  attemptedAt: Date;
}
