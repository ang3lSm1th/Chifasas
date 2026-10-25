import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let mockCategoryRepo: any;
  let mockSubcategoryRepo: any;
  let mockProductRepo: any;

  beforeEach(() => {
    mockCategoryRepo = {
      create: vi.fn((data) => ({ ...data, id: 1 })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 1 })),
      find: vi.fn(),
      findOne: vi.fn(),
      softDelete: vi.fn(async () => ({ affected: 1 })),
    };

    mockSubcategoryRepo = {
      create: vi.fn((data) => ({ ...data, id: 10 })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 10 })),
      find: vi.fn(),
      findOne: vi.fn(),
      softDelete: vi.fn(async () => ({ affected: 1 })),
    };

    mockProductRepo = {
      create: vi.fn((data) => ({ ...data, id: 'prod-uuid-1' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 'prod-uuid-1' })),
      find: vi.fn(),
      findOne: vi.fn(),
      softDelete: vi.fn(async () => ({ affected: 1 })),
    };

    service = new CatalogService(mockCategoryRepo, mockSubcategoryRepo, mockProductRepo);
  });

  describe('createCategory', () => {
    it('debe crear una categoría correctamente', async () => {
      const result = await service.createCategory('chifa-mariana', {
        name: 'Chaufas y Arroces',
        type: 'FOOD',
        displayOrder: 1,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Chaufas y Arroces');
      expect(result.type).toBe('FOOD');
    });
  });

  describe('createProduct', () => {
    it('debe crear un producto asociado a categoría y estación KDS', async () => {
      mockCategoryRepo.findOne.mockResolvedValue({ id: 1, type: 'FOOD' });

      const result = await service.createProduct('chifa-mariana', {
        name: 'Aeropuerto Especial',
        categoryId: 1,
        kdsStationId: 'kds-wok-1',
        price: 24.5,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('prod-uuid-1');
      expect(result.name).toBe('Aeropuerto Especial');
      expect(result.kdsStationId).toBe('kds-wok-1');
      expect(result.price).toBe(24.5);
      expect(result.isBeverage).toBe(false);
    });

    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createProduct('chifa-mariana', {
          name: 'Chaufa',
          categoryId: 999,
          price: 15.0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findFullMenu', () => {
    it('debe estructurar el menú agrupado por categorías con sus productos', async () => {
      mockCategoryRepo.find.mockResolvedValue([
        { id: 1, name: 'Chaufas', displayOrder: 1, subcategories: [] },
      ]);
      mockProductRepo.find.mockResolvedValue([
        { id: 'p1', name: 'Chaufa de Pollo', categoryId: 1, price: 18.0 },
      ]);

      const menu = await service.findFullMenu('chifa-mariana');
      expect(menu).toHaveLength(1);
      expect(menu[0].products).toHaveLength(1);
      expect(menu[0].products[0].name).toBe('Chaufa de Pollo');
    });
  });
});
