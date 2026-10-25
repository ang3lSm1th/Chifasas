import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { KdsStationsService } from './kds-stations.service';
import { KdsStation } from './entities/kds-station.entity';

describe('KdsStationsService', () => {
  let service: KdsStationsService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'station-uuid-1' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 'station-uuid-1' })),
      softDelete: vi.fn(async () => ({ affected: 1 })),
    };

    service = new KdsStationsService(mockRepo);
  });

  describe('create', () => {
    it('debe crear una estación KDS exitosamente', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.create('chifa-mariana', {
        name: 'Woks',
        colorHex: '#EF4444',
        displayOrder: 1,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Woks');
      expect(result.colorHex).toBe('#EF4444');
      expect(result.displayOrder).toBe(1);
      expect(result.isActive).toBe(true);
    });

    it('debe rechazar con ConflictException si ya existe una estación con el mismo nombre en el tenant', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'station-existing',
        tenantId: 'chifa-mariana',
        name: 'Woks',
      } as KdsStation);

      await expect(
        service.create('chifa-mariana', { name: 'Woks' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe listar todas las estaciones del tenant ordenadas por displayOrder', async () => {
      const stations = [
        { id: '1', name: 'Woks', displayOrder: 1 },
        { id: '2', name: 'Freidora', displayOrder: 2 },
      ];
      mockRepo.find.mockResolvedValue(stations);

      const result = await service.findAll('chifa-mariana');
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'chifa-mariana' },
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar la estación si existe', async () => {
      const station = { id: 'station-1', name: 'Woks', tenantId: 'chifa-mariana' };
      mockRepo.findOne.mockResolvedValue(station);

      const result = await service.findOne('chifa-mariana', 'station-1');
      expect(result.id).toBe('station-1');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('chifa-mariana', 'non-existing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar una estación existente', async () => {
      const existing = {
        id: 'station-1',
        name: 'Woks',
        colorHex: '#2563EB',
        tenantId: 'chifa-mariana',
      };
      mockRepo.findOne.mockResolvedValueOnce(existing);

      const result = await service.update('chifa-mariana', 'station-1', {
        name: 'Woks y Salteados',
        colorHex: '#F59E0B',
      });

      expect(result.name).toBe('Woks y Salteados');
      expect(result.colorHex).toBe('#F59E0B');
    });
  });

  describe('remove', () => {
    it('debe realizar un soft-delete de la estación', async () => {
      const existing = { id: 'station-1', name: 'Woks', tenantId: 'chifa-mariana' };
      mockRepo.findOne.mockResolvedValue(existing);

      const result = await service.remove('chifa-mariana', 'station-1');
      expect(result.success).toBe(true);
      expect(mockRepo.softDelete).toHaveBeenCalledWith({
        id: 'station-1',
        tenantId: 'chifa-mariana',
      });
    });
  });
});
