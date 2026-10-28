import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftActiveGuard } from './guards/shift-active.guard';
import { ShiftBoundSessionGuard } from './guards/shift-bound-session.guard';
import { Shift } from './entities/shift.entity';

describe('ShiftsService & Shift Guards', () => {
  let service: ShiftsService;
  let mockRepo: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockRepo = {
      findOne: vi.fn(),
      count: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: '101' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || '101' })),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new ShiftsService(mockRepo, mockEventEmitter);
  });

  describe('openShift', () => {
    it('debe abrir un turno exitosamente cuando no hay turno activo previo', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.openShift('chifa-mariana', 'user-admin-1', {
        initialCash: 150.0,
        notes: 'Fondo inicial para turno de almuerzo',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('101');
      expect(result.status).toBe('OPEN');
      expect(result.initialCash).toBe(150.0);
      expect(result.expectedCash).toBe(150.0);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'shift.opened',
        expect.objectContaining({
          shiftId: '101',
          tenantId: 'chifa-mariana',
          initialCash: 150.0,
        }),
      );
    });

    it('debe rechazar con ConflictException (409) si ya existe un turno abierto para el tenant', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: '99',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
      } as Shift);

      await expect(
        service.openShift('chifa-mariana', 'user-admin-1', {
          initialCash: 100,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('closeShift y Ventana de Gracia de 2.5 Horas', () => {
    it('debe cerrar el turno, calcular discrepancia y fijar exactamente 150 min (2.5h) de gracia', async () => {
      const activeShift = {
        id: '101',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
        expectedCash: 350.0,
        openedAt: new Date(Date.now() - 3600000),
      } as Shift;

      mockRepo.findOne.mockResolvedValue(activeShift);

      const result = await service.closeShift('chifa-mariana', 'user-cajero-1', {
        declaredCash: 345.0,
        notes: 'Faltante menor de 5 soles',
      });

      expect(result.status).toBe('CLOSED');
      expect(result.closedById).toBe('user-cajero-1');
      expect(result.declaredCash).toBe(345.0);
      expect(result.difference).toBe(-5.0);
      expect(result.closedAt).toBeDefined();
      expect(result.graceExpiresAt).toBeDefined();

      // Verificar que graceExpiresAt es exactamente ~150 minutos (2.5 horas) después de closedAt
      const graceDiffMinutes =
        (result.graceExpiresAt!.getTime() - result.closedAt!.getTime()) / 60000;
      expect(Math.round(graceDiffMinutes)).toBe(150);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'shift.closed',
        expect.objectContaining({
          shiftId: '101',
          difference: -5.0,
        }),
      );
    });

    it('debe lanzar NotFoundException si no existe turno abierto para cerrar', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.closeShift('chifa-mariana', 'user-cajero-1', {
          declaredCash: 200,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ShiftActiveGuard', () => {
    it('debe permitir la acción si la caja tiene turno abierto', async () => {
      mockRepo.count.mockResolvedValue(1);
      const guard = new ShiftActiveGuard(service);

      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'chifa-mariana',
          }),
        }),
      };

      const canActivate = await guard.canActivate(contextMock);
      expect(canActivate).toBe(true);
    });

    it('debe bloquear con PreconditionFailedException (412) si no hay turno abierto', async () => {
      mockRepo.count.mockResolvedValue(0);
      const guard = new ShiftActiveGuard(service);

      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'chifa-mariana',
          }),
        }),
      };

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        PreconditionFailedException,
      );
    });
  });

  describe('ShiftBoundSessionGuard', () => {
    it('debe permitir la sesión de forma transparente si el turno está abierto', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: '101',
        status: 'OPEN',
      });
      const guard = new ShiftBoundSessionGuard(service);

      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            tenantId: 'chifa-mariana',
          }),
        }),
      };

      const canActivate = await guard.canActivate(contextMock);
      expect(canActivate).toBe(true);
    });
  });
});
