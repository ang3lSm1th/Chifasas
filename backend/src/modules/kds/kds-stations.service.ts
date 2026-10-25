import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { KdsStation } from './entities/kds-station.entity';
import { CreateKdsStationDto } from './dto/create-kds-station.dto';
import { UpdateKdsStationDto } from './dto/update-kds-station.dto';

@Injectable()
export class KdsStationsService {
  constructor(
    @InjectRepository(KdsStation)
    private readonly kdsStationRepository: Repository<KdsStation>,
  ) {}

  async create(tenantId: string, dto: CreateKdsStationDto): Promise<KdsStation> {
    const existing = await this.kdsStationRepository.findOne({
      where: { tenantId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una estación KDS con el nombre '${dto.name}'`);
    }

    const station = this.kdsStationRepository.create({
      id: randomUUID(),
      tenantId,
      name: dto.name,
      colorHex: dto.colorHex || '#2563EB',
      displayOrder: dto.displayOrder ?? 0,
      isActive: true,
    });

    return this.kdsStationRepository.save(station);
  }

  async findAll(tenantId: string): Promise<KdsStation[]> {
    return this.kdsStationRepository.find({
      where: { tenantId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<KdsStation> {
    const station = await this.kdsStationRepository.findOne({
      where: { tenantId, id },
    });

    if (!station) {
      throw new NotFoundException(`Estación KDS con ID '${id}' no encontrada`);
    }

    return station;
  }

  async update(tenantId: string, id: string, dto: UpdateKdsStationDto): Promise<KdsStation> {
    const station = await this.findOne(tenantId, id);

    if (dto.name && dto.name !== station.name) {
      const existing = await this.kdsStationRepository.findOne({
        where: { tenantId, name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe otra estación KDS con el nombre '${dto.name}'`);
      }
      station.name = dto.name;
    }

    if (dto.colorHex !== undefined) station.colorHex = dto.colorHex;
    if (dto.displayOrder !== undefined) station.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) station.isActive = dto.isActive;

    return this.kdsStationRepository.save(station);
  }

  async remove(tenantId: string, id: string): Promise<{ success: boolean; id: string }> {
    const station = await this.findOne(tenantId, id);
    await this.kdsStationRepository.softDelete({ id: station.id, tenantId });
    return { success: true, id };
  }
}
