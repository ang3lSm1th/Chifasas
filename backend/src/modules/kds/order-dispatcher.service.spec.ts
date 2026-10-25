import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderDispatcherService, DispatchOrderPayload } from './order-dispatcher.service';

describe('OrderDispatcherService (Despacho Dual)', () => {
  let service: OrderDispatcherService;
  let mockGateway: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockGateway = {
      notifyKdsStation: vi.fn(),
      notifyCashier: vi.fn(),
    };
    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new OrderDispatcherService(mockGateway, mockEventEmitter);
  });

  it('debe fragmentar ítems a sus pantallas KDS correspondientes y notificar la comanda completa a Caja', async () => {
    const payload: DispatchOrderPayload = {
      orderId: 'order-101',
      tenantId: 'chifa-mariana',
      tableNumber: 'Mesa 4',
      orderType: 'DINE_IN',
      waiterName: 'Rosa Melgar',
      items: [
        {
          productId: 'prod-chaufa',
          productName: 'Arroz Chaufa Especial',
          quantity: 2,
          price: 22.0,
          kdsStationId: 'kds-wok-1',
        },
        {
          productId: 'prod-broaster',
          productName: '1/4 Pollo Broaster',
          quantity: 1,
          price: 18.0,
          kdsStationId: 'kds-freidora-2',
        },
        {
          productId: 'prod-gaseosa',
          productName: 'Inca Kola 1.5L',
          quantity: 1,
          price: 10.0,
          kdsStationId: null, // Bebida despachada directamente
        },
      ],
      totalAmount: 72.0,
    };

    const result = await service.dispatchOrder(payload);

    // 1. Verificación del resultado general
    expect(result.cashierNotified).toBe(true);
    expect(result.kdsStationsNotified).toContain('kds-wok-1');
    expect(result.kdsStationsNotified).toContain('kds-freidora-2');
    expect(result.totalItems).toBe(3);

    // 2. Verificación de fragmentación hacia pantalla Woks
    expect(mockGateway.notifyKdsStation).toHaveBeenCalledWith(
      'chifa-mariana',
      'kds-wok-1',
      'kds:order_items',
      expect.objectContaining({
        orderId: 'order-101',
        tableNumber: 'Mesa 4',
        items: [
          expect.objectContaining({
            productId: 'prod-chaufa',
            productName: 'Arroz Chaufa Especial',
            quantity: 2,
          }),
        ],
      }),
    );

    // 3. Verificación de fragmentación hacia pantalla Freidora
    expect(mockGateway.notifyKdsStation).toHaveBeenCalledWith(
      'chifa-mariana',
      'kds-freidora-2',
      'kds:order_items',
      expect.objectContaining({
        orderId: 'order-101',
        tableNumber: 'Mesa 4',
        items: [
          expect.objectContaining({
            productId: 'prod-broaster',
            productName: '1/4 Pollo Broaster',
            quantity: 1,
          }),
        ],
      }),
    );

    // 4. REGLA INMUTABLE: Notificación íntegra a Caja con TODOS los ítems (3 ítems)
    expect(mockGateway.notifyCashier).toHaveBeenCalledWith(
      'chifa-mariana',
      'cashier:order_ticket',
      expect.objectContaining({
        orderId: 'order-101',
        totalAmount: 72.0,
        items: payload.items,
      }),
    );

    // 5. Verificación de emisión de evento de dominio
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'order.dispatched',
      expect.objectContaining({
        orderId: 'order-101',
        tenantId: 'chifa-mariana',
        totalAmount: 72.0,
        itemCount: 3,
      }),
    );
  });
});
