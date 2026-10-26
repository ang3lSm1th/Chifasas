import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KdsGateway } from './kds.gateway';

describe('KdsGateway', () => {
  let gateway: KdsGateway;
  let mockSocket: any;
  let mockServer: any;

  beforeEach(() => {
    gateway = new KdsGateway();
    mockSocket = {
      id: 'sock-123',
      join: vi.fn(),
      emit: vi.fn(),
    };
    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    gateway.server = mockServer as any;
  });

  describe('handleJoinKds', () => {
    it('debe suscribir al cliente a la sala KDS correspondiente', () => {
      const response = gateway.handleJoinKds(mockSocket, {
        tenantId: 'chifa-mariana',
        stationId: 'wok-station-1',
      });

      expect(response.success).toBe(true);
      expect(response.room).toBe('room:tenant_chifa-mariana:kds_wok-station-1');
      expect(mockSocket.join).toHaveBeenCalledWith('room:tenant_chifa-mariana:kds_wok-station-1');
    });

    it('debe rechazar si falta tenantId o stationId', () => {
      const response = gateway.handleJoinKds(mockSocket, {
        tenantId: '',
        stationId: 'wok-1',
      });

      expect(response.success).toBe(false);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinCashier', () => {
    it('debe suscribir al cliente a la sala de Caja del tenant', () => {
      const response = gateway.handleJoinCashier(mockSocket, {
        tenantId: 'chifa-mariana',
      });

      expect(response.success).toBe(true);
      expect(response.room).toBe('room:tenant_chifa-mariana:cashier');
      expect(mockSocket.join).toHaveBeenCalledWith('room:tenant_chifa-mariana:cashier');
    });
  });

  describe('notifyKdsStation and notifyCashier', () => {
    it('debe emitir a la sala de estación KDS específica', () => {
      gateway.notifyKdsStation('chifa-mariana', 'wok-1', 'order:item_added', {
        dishName: 'Chaufa Especial',
      });

      expect(mockServer.to).toHaveBeenCalledWith('room:tenant_chifa-mariana:kds_wok-1');
      expect(mockServer.emit).toHaveBeenCalledWith('order:item_added', {
        dishName: 'Chaufa Especial',
      });
    });

    it('debe emitir a la sala de Caja', () => {
      gateway.notifyCashier('chifa-mariana', 'order:full_ticket', {
        orderId: 'ord-101',
        total: 45.0,
      });

      expect(mockServer.to).toHaveBeenCalledWith('room:tenant_chifa-mariana:cashier');
      expect(mockServer.emit).toHaveBeenCalledWith('order:full_ticket', {
        orderId: 'ord-101',
        total: 45.0,
      });
    });

    it('debe suscribir y notificar a la sala de Meseras (Comandero Móvil)', () => {
      const joinRes = gateway.handleJoinWaiters(mockSocket, {
        tenantId: 'chifa-mariana',
      });
      expect(joinRes.success).toBe(true);
      expect(joinRes.room).toBe('room:tenant_chifa-mariana:waiters');

      gateway.notifyWaiters('chifa-mariana', 'order:status_updated', {
        orderId: 'ord-101',
        status: 'READY',
      });
      expect(mockServer.to).toHaveBeenCalledWith('room:tenant_chifa-mariana:waiters');
    });
  });
});
