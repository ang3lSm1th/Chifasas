import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockProductRepo: any;
  let mockMovementRepo: any;
  let mockDataSource: any;
  let mockQueryRunner: any;

  beforeEach(() => {
    mockProductRepo = {
      createQueryBuilder: vi.fn(),
    };

    mockMovementRepo = {
      find: vi.fn(),
    };

    mockQueryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager: {
        findOne: vi.fn(),
        update: vi.fn(),
        create: vi.fn((entity, data) => ({ ...data, id: '1' })),
        save: vi.fn(async (m) => m),
      },
    };

    mockDataSource = {
      createQueryRunner: vi.fn(() => mockQueryRunner),
    };

    service = new InventoryService(mockProductRepo, mockMovementRepo, mockDataSource);
  });

  describe('deductStock', () => {
    it('debe descontar stock atómicamente si hay suficiente inventario', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 'prod-gaseosa-1',
        name: 'Inca Kola 1.5L',
        tenantId: 'chifa-mariana',
        isBeverage: true,
        currentStock: 10,
        minStockAlert: 3,
      });

      const result = await service.deductStock('chifa-mariana', 'user-1', {
        productId: 'prod-gaseosa-1',
        quantity: 2,
      });

      expect(result.success).toBe(true);
      expect(result.previousStock).toBe(10);
      expect(result.newStock).toBe(8);
      expect(result.isLowStock).toBe(false);
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'prod-gaseosa-1', tenantId: 'chifa-mariana' },
        { currentStock: 8 },
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debe rechazar con BadRequestException si el stock solicitado supera el disponible', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 'prod-gaseosa-1',
        name: 'Inca Kola 1.5L',
        tenantId: 'chifa-mariana',
        isBeverage: true,
        currentStock: 1,
        minStockAlert: 3,
      });

      await expect(
        service.deductStock('chifa-mariana', 'user-1', {
          productId: 'prod-gaseosa-1',
          quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.deductStock('chifa-mariana', 'user-1', {
          productId: 'non-existing',
          quantity: 1,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('restock', () => {
    it('debe incrementar stock y registrar movimiento', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 'prod-gaseosa-1',
        name: 'Inca Kola 1.5L',
        tenantId: 'chifa-mariana',
        currentStock: 5,
      });

      const result = await service.restock('chifa-mariana', 'user-admin', {
        productId: 'prod-gaseosa-1',
        quantity: 12,
        notes: 'Compra por fardo',
      });

      expect(result.success).toBe(true);
      expect(result.previousStock).toBe(5);
      expect(result.newStock).toBe(17);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
