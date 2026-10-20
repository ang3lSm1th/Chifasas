import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      relations: { role: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUsername(username: string, tenantId?: string): Promise<User | null> {
    const where: any = { username };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return this.userRepository.findOne({
      where,
      relations: { role: true },
    });
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(`El nombre de usuario '${dto.username}' ya está registrado.`);
    }

    const role = await this.roleRepository.findOne({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException(`El rol con ID ${dto.roleId} no existe.`);
    }

    // Hash criptográfico con salt rounds = 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      tenantId,
      username: dto.username,
      fullName: dto.fullName,
      dni: dto.dni,
      phone: dto.phone,
      roleId: dto.roleId,
      passwordHash,
      isActive: true,
    });

    return this.userRepository.save(newUser);
  }

  async toggleStatus(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('Trabajador no encontrado en este restaurante.');
    }
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('Trabajador no encontrado.');
    }
    // REGLA INMUTABLE: softDelete sin eliminar físicamente registros
    await this.userRepository.softDelete(id);
  }
}
