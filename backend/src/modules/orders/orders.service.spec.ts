import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ShiftActiveGuard } from '../shifts/guards/shift-active.guard';

describe('OrdersService & ShiftActiveGuard (Fase 4: Comandero Web y Despacho Concurrente)', () => {
  let service: OrdersService;
  let mockOrderRepo: any;
  let mockOrderItemRepo: any;
  let mockProductRepo: any;
  let mockInventoryService: any;
  let mockShiftsService: any;
  let mockOrderDispatcher: any;
  let mockKdsGateway: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockOrderRepo = {
      create: vi.fn((data) => ({ ...data, createdAt: new Date() })),
      save: vi.fn(async (entity) => ({ ...entity, createdAt: new Date() })),
      find: vi.fn(async () => []),
      findOne: vi.fn(),
    };

    mockOrderItemRepo = {
      create: vi.fn((data) => ({ id: 'item-1', ...data })),
      save: vi.fn(async (entity) => entity),
      update: vi.fn(async () => ({ affected: 1 })),
      findOne: vi.fn(),
    };

    mockProductRepo = {
      findOne: vi.fn(),
    };

    mockInventoryService = {
      deductStock: vi.fn(async () => ({ success: true })),
    };

    mockShiftsService = {
      getCurrentShift: vi.fn(async () => ({
        isShiftOpen: true,
        shift: { id: '501', status: 'OPEN' },
      })),
      hasOpenShift: vi.fn(async () => true),
    };

    mockOrderDispatcher = {
      dispatchOrder: vi.fn(async (payload) => ({
        orderId: payload.orderId,
        tenantId: payload.tenantId,
        cashierNotified: true,
        kdsStationsNotified: ['kds-wok-1', 'kds-broaster-2'],
        totalItems: payload.items.length,
      })),
    };

    mockKdsGateway = {
      notifyWaiters: vi.fn(),
      notifyCashier: vi.fn(),
      notifyKdsStation: vi.fn(),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new OrdersService(
      mockOrderRepo,
      mockOrderItemRepo,
      mockProductRepo,
      mockInventoryService,
      mockShiftsService,
      mockOrderDispatcher,
      mockKdsGateway,
      mockEventEmitter,
    );
  });

  describe('QA-01: Creación de Comanda Mixta, Descuento de Bebidas y Despacho Dual', () => {
    it('debe descontar stock de bebidas, persistir la orden con precios del servidor y despachar a KDS + Caja', async () => {
      mockProductRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.tenantId !== 'chifa-mariana') return null;
        if (where.id === 'prod-chaufa') {
          return {
            id: 'prod-chaufa',
            tenantId: 'chifa-mariana',
            name: 'Arroz Chaufa Especial',
            price: 24.5,
            isBeverage: false,
            kdsStationId: 'kds-wok-1',
            isActive: true,
          };
        }
        if (where.id === 'prod-inkakola') {
          return {
            id: 'prod-inkakola',
            tenantId: 'chifa-mariana',
            name: 'Inca Kola 1.5L Helada',
            price: 12.0,
            isBeverage: true,
            currentStock: 10,
            kdsStationId: null,
            isActive: true,
          };
        }
        return null;
      });

      const result = await service.createOrder(
        'chifa-mariana',
        { id: 'waiter-01', fullName: 'Lucía Gómez' },
        {
          orderType: 'DINE_IN',
          tableNumber: 'Mesa 5',
          notes: 'Cliente frecuente',
          items: [
            { productId: 'prod-chaufa', quantity: 2, notes: 'Sin cebolla china' },
            { productId: 'prod-inkakola', quantity: 1, notes: 'Con 3 vasos' },
          ],
        },
      );

      // Total esperado: (2 * 24.50) + (1 * 12.00) = 61.00
      expect(result.order.totalAmount).toBe(61.0);
      expect(result.order.tableNumber).toBe('Mesa 5');
      expect(result.order.shiftId).toBe('501');
      expect(result.dispatch.cashierNotified).toBe(true);

      // Verifica que se descontó stock SOLO para la bebida
      expect(mockInventoryService.deductStock).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.deductStock).toHaveBeenCalledWith(
        'chifa-mariana',
        'waiter-01',
        expect.objectContaining({
          productId: 'prod-inkakola',
          quantity: 1,
        }),
      );

      // Verifica despacho dual inmutable (KDS + Caja)
      expect(mockOrderDispatcher.dispatchOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'chifa-mariana',
          tableNumber: 'Mesa 5',
          waiterName: 'Lucía Gómez',
          totalAmount: 61.0,
        }),
      );

      // Verifica emisión de OrderCreatedEvent
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({
          tenantId: 'chifa-mariana',
          tableNumber: 'Mesa 5',
          totalAmount: 61.0,
        }),
      );

      // Verifica notificación en vivo a sala de meseras
      expect(mockKdsGateway.notifyWaiters).toHaveBeenCalledWith(
        'chifa-mariana',
        'order:created',
        expect.objectContaining({
          tableNumber: 'Mesa 5',
          totalAmount: 61.0,
        }),
      );
    });
  });

  describe('QA-02: Bloqueo de Comandas sin Turno Abierto (412 Precondition Failed)', () => {
    it('debe rechazar con 412 PreconditionFailedException cuando no hay turno abierto en el tenant', async () => {
      mockShiftsService.hasOpenShift.mockResolvedValue(false);
      const guard = new ShiftActiveGuard(mockShiftsService);

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'waiter-01', tenantId: 'chifa-mariana' },
          }),
        }),
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        PreconditionFailedException,
      );
    });
  });

  describe('QA-03: Bloqueo por Agotamiento de Stock de Bebidas', () => {
    it('debe abortar la creación y el despacho de la comanda si una bebida está agotada', async () => {
      mockProductRepo.findOne.mockResolvedValue({
        id: 'prod-gaseosa-agotada',
        tenantId: 'chifa-mariana',
        name: 'Coca Cola 1.5L',
        price: 12.0,
        isBeverage: true,
        currentStock: 0,
        isActive: true,
      });

      mockInventoryService.deductStock.mockRejectedValue(
        new BadRequestException("Stock insuficiente para 'Coca Cola 1.5L'. Disponible: 0"),
      );

      await expect(
        service.createOrder(
          'chifa-mariana',
          { id: 'waiter-01', fullName: 'Lucía' },
          {
            orderType: 'DINE_IN',
            tableNumber: 'Mesa 2',
            items: [{ productId: 'prod-gaseosa-agotada', quantity: 1 }],
          },
        ),
      ).rejects.toThrow(BadRequestException);

      // No debe persistir la orden ni emitir eventos a KDS o Caja
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
      expect(mockOrderDispatcher.dispatchOrder).not.toHaveBeenCalled();
    });
  });

  describe('QA-04: Aislamiento Estricto Multi-Tenant en Pedidos', () => {
    it('debe impedir ordenar productos pertenecientes a otro tenant', async () => {
      mockProductRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.tenantId === 'tenant-intruso') return null;
        return { id: 'prod-1', tenantId: 'chifa-mariana' };
      });

      await expect(
        service.createOrder(
          'tenant-intruso',
          { id: 'user-intruso', fullName: 'Intruso' },
          {
            orderType: 'DINE_IN',
            tableNumber: 'Mesa 1',
            items: [{ productId: 'prod-1', quantity: 1 }],
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('QA-05: Concurrencia de Comanderos Móviles y Cambio de Estado KDS', () => {
    it('debe procesar múltiples comandas concurrentes de distintas meseras sin colisión', async () => {
      mockProductRepo.findOne.mockResolvedValue({
        id: 'prod-tallarin',
        tenantId: 'chifa-mariana',
        name: 'Tallarín Saltado Taypá',
        price: 28.0,
        isBeverage: false,
        kdsStationId: 'kds-wok-1',
        isActive: true,
      });

      const [res1, res2, res3] = await Promise.all([
        service.createOrder(
          'chifa-mariana',
          { id: 'w-1', fullName: 'Mesera 1' },
          { tableNumber: 'Mesa 1', items: [{ productId: 'prod-tallarin', quantity: 1 }] },
        ),
        service.createOrder(
          'chifa-mariana',
          { id: 'w-2', fullName: 'Mesera 2' },
          { tableNumber: 'Mesa 2', items: [{ productId: 'prod-tallarin', quantity: 2 }] },
        ),
        service.createOrder(
          'chifa-mariana',
          { id: 'w-3', fullName: 'Mesera 3' },
          { tableNumber: 'Mesa 3', items: [{ productId: 'prod-tallarin', quantity: 3 }] },
        ),
      ]);

      expect(res1.order.totalAmount).toBe(28.0);
      expect(res2.order.totalAmount).toBe(56.0);
      expect(res3.order.totalAmount).toBe(84.0);
      expect(mockOrderDispatcher.dispatchOrder).toHaveBeenCalledTimes(3);
    });

    it('debe actualizar el estado de una comanda a READY y notificar a Meseras y Caja por WebSocket', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-999',
        orderNumber: 'ORD-9999',
        tenantId: 'chifa-mariana',
        tableNumber: 'Mesa 8',
        orderType: 'DINE_IN',
        status: 'PREPARING',
        totalAmount: 45.0,
        items: [{ id: 'it-1', kdsStatus: 'PREPARING' }],
      });

      const updated = await service.updateOrderStatus('chifa-mariana', 'ord-999', 'READY');

      expect(updated.status).toBe('READY');
      expect(mockKdsGateway.notifyWaiters).toHaveBeenCalledWith(
        'chifa-mariana',
        'order:status_updated',
        expect.objectContaining({
          orderId: 'ord-999',
          status: 'READY',
          tableNumber: 'Mesa 8',
        }),
      );
      expect(mockKdsGateway.notifyCashier).toHaveBeenCalledWith(
        'chifa-mariana',
        'order:status_updated',
        expect.objectContaining({
          orderId: 'ord-999',
          status: 'READY',
        }),
      );
    });
  });
});
