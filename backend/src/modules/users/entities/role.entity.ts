import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CAJERO = 'CAJERO',
  MESERA = 'MESERA',
  COCINERO = 'COCINERO',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: RoleType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;
}
