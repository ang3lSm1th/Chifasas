import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { BillingService } from './billing.service';

describe('BillingService (Fase 5: Cobranza POS, Arqueo al Centavo y Auditoría Financiera)', () => {
  let service: BillingService;
  let mockPaymentRepo: any;
  let mockOrderRepo: any;
  let mockOrderItemRepo: any;
  let mockShiftRepo: any;
  let mockKdsGateway: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPaymentRepo = {
      create: vi.fn((data) => ({ ...data })),
      save: vi.fn(async (entity) => ({ ...entity })),
      find: vi.fn(async () => []),
    };

    mockOrderRepo = {
      findOne: vi.fn(),
      save: vi.fn(async (entity) => entity),
    };

    mockOrderItemRepo = {
      update: vi.fn(async () => ({ affected: 2 })),
    };

    mockShiftRepo = {
      findOne: vi.fn(),
      save: vi.fn(async (entity) => entity),
      find: vi.fn(async () => []),
    };

    mockKdsGateway = {
      notifyCashier: vi.fn(),
      notifyWaiters: vi.fn(),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new BillingService(
      mockPaymentRepo,
      mockOrderRepo,
      mockOrderItemRepo,
      mockShiftRepo,
      mockKdsGateway,
      mockEventEmitter,
    );
  });

  describe('QA-01: Cobro en Efectivo, Cálculo de Vuelto y Cuadre de Caja al Centavo', () => {
    it('debe calcular el vuelto exacto al centavo e incrementar shift.expectedCash sin errores de punto flotante', async () => {
      const openShift = {
        id: '701',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
        initialCash: 150.0,
        expectedCash: 150.1, // Simulando centavos previos
      };
      mockShiftRepo.findOne.mockResolvedValue(openShift);

      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-cash-1',
        orderNumber: 'ORD-1001',
        tenantId: 'chifa-mariana',
        tableNumber: 'Mesa 3',
        status: 'SERVED',
        totalAmount: 42.7,
        items: [],
      });

      const res = await service.processPayment(
        'chifa-mariana',
        { id: 'cashier-01', fullName: 'Carlos Cajero' },
        {
          orderId: 'ord-cash-1',
          paymentMethod: 'CASH',
          receiptType: 'BOLETA',
          cashReceived: 50.0,
          customerDocument: '71234567',
          customerName: 'Juan Pérez',
        },
      );

      // Vuelto esperado: 50.00 - 42.70 = 7.30 exacto
      expect(res.payment.amount).toBe(42.7);
      expect(res.payment.cashReceived).toBe(50.0);
      expect(res.payment.changeGiven).toBe(7.3);
      expect(res.payment.receiptNumber).toMatch(/^B001-/);

      // Nuevo efectivo esperado en gaveta: 150.10 + 42.70 = 192.80 exacto al centavo
      expect(res.shiftExpectedCash).toBe(192.8);
      expect(mockShiftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ expectedCash: 192.8 }),
      );
      expect(res.order.status).toBe('PAID');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.paid',
        expect.objectContaining({
          orderId: 'ord-cash-1',
          amount: 42.7,
          changeGiven: 7.3,
        }),
      );
    });
  });

  describe('QA-02: Cobros Digitales (Yape, Plin y Tarjeta) sin Alterar Efectivo Físico de Gaveta', () => {
    it('debe registrar cobro con YAPE y código de operación manteniendo intacto expectedCash de gaveta', async () => {
      const openShift = {
        id: '701',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
        initialCash: 100.0,
        expectedCash: 100.0,
      };
      mockShiftRepo.findOne.mockResolvedValue(openShift);

      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-yape-1',
        orderNumber: 'ORD-1002',
        tenantId: 'chifa-mariana',
        tableNumber: 'Mesa 7',
        status: 'READY',
        totalAmount: 65.5,
      });

      const res = await service.processPayment(
        'chifa-mariana',
        { id: 'cashier-01', fullName: 'Carlos Cajero' },
        {
          orderId: 'ord-yape-1',
          paymentMethod: 'YAPE',
          receiptType: 'TICKET',
          operationCode: 'YAPE-984120',
        },
      );

      expect(res.payment.paymentMethod).toBe('YAPE');
      expect(res.payment.operationCode).toBe('YAPE-984120');
      expect(res.payment.amount).toBe(65.5);
      expect(res.payment.changeGiven).toBe(0);
      // El efectivo físico esperado en gaveta permanece en 100.00
      expect(res.shiftExpectedCash).toBe(100.0);
      expect(mockShiftRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('QA-03: Bloqueo de Doble Cobro, Monto Insuficiente y Turno Cerrado', () => {
    it('debe rechazar con 409 Conflict si se intenta cobrar una comanda que ya está PAID', async () => {
      mockShiftRepo.findOne.mockResolvedValue({
        id: '701',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
      });
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-paid-1',
        orderNumber: 'ORD-1003',
        tenantId: 'chifa-mariana',
        status: 'PAID',
        totalAmount: 30.0,
      });

      await expect(
        service.processPayment(
          'chifa-mariana',
          { id: 'cashier-01' },
          { orderId: 'ord-paid-1', paymentMethod: 'CASH', cashReceived: 30.0 },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar con 400 BadRequestException si el efectivo recibido es menor al total de la orden', async () => {
      mockShiftRepo.findOne.mockResolvedValue({
        id: '701',
        tenantId: 'chifa-mariana',
        status: 'OPEN',
        expectedCash: 100,
      });
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-under-1',
        orderNumber: 'ORD-1004',
        tenantId: 'chifa-mariana',
        status: 'SERVED',
        totalAmount: 48.0,
      });

      await expect(
        service.processPayment(
          'chifa-mariana',
          { id: 'cashier-01' },
          { orderId: 'ord-under-1', paymentMethod: 'CASH', cashReceived: 40.0 },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 412 PreconditionFailedException si no hay turno abierto', async () => {
      mockShiftRepo.findOne.mockResolvedValue(null);

      await expect(
        service.processPayment(
          'chifa-mariana',
          { id: 'cashier-01' },
          { orderId: 'ord-1', paymentMethod: 'CASH', cashReceived: 50 },
        ),
      ).rejects.toThrow(PreconditionFailedException);
    });
  });

  describe('QA-04: Pre-Cuenta y Reporte Analítico de Auditoría Financiera por Producto y Método', () => {
    it('debe consolidar ventas por método de pago (Efectivo, Yape, Plin, Tarjeta) y ranking de productos al centavo', async () => {
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'pay-1',
          tenantId: 'chifa-mariana',
          paymentMethod: 'CASH',
          receiptType: 'BOLETA',
          amount: 49.0,
          order: {
            items: [
              {
                productId: 'prod-chaufa',
                productName: 'Arroz Chaufa Especial',
                quantity: 2,
                subtotal: 49.0,
              },
            ],
          },
        },
        {
          id: 'pay-2',
          tenantId: 'chifa-mariana',
          paymentMethod: 'YAPE',
          receiptType: 'TICKET',
          amount: 36.5,
          order: {
            items: [
              {
                productId: 'prod-chaufa',
                productName: 'Arroz Chaufa Especial',
                quantity: 1,
                subtotal: 24.5,
              },
              {
                productId: 'prod-inka',
                productName: 'Inca Kola 1.5L',
                quantity: 1,
                subtotal: 12.0,
              },
            ],
          },
        },
        {
          id: 'pay-3',
          tenantId: 'chifa-mariana',
          paymentMethod: 'PLIN',
          receiptType: 'FACTURA',
          amount: 28.0,
          order: {
            items: [
              {
                productId: 'prod-tallarin',
                productName: 'Tallarín Saltado',
                quantity: 1,
                subtotal: 28.0,
              },
            ],
          },
        },
      ]);

      mockShiftRepo.find.mockResolvedValue([
        {
          id: '701',
          status: 'CLOSED',
          openedById: 'admin-1',
          initialCash: 100.0,
          expectedCash: 149.0,
          declaredCash: 149.0,
          difference: 0.0,
          openedAt: new Date(),
          closedAt: new Date(),
        },
      ]);

      const report = await service.getFinancialAuditReport('chifa-mariana');

      // Total: 49.00 + 36.50 + 28.00 = 113.50
      expect(report.summary.totalRevenue).toBe(113.5);
      expect(report.summary.cashRevenue).toBe(49.0);
      expect(report.summary.digitalRevenue).toBe(64.5);
      expect(report.summary.totalTransactions).toBe(3);

      // Métodos de pago
      expect(report.paymentMethodsBreakdown.CASH.total).toBe(49.0);
      expect(report.paymentMethodsBreakdown.YAPE.total).toBe(36.5);
      expect(report.paymentMethodsBreakdown.PLIN.total).toBe(28.0);
      expect(report.paymentMethodsBreakdown.CARD.total).toBe(0);

      // Ranking de productos: Chaufa #1 con 3 unidades y S/ 73.50
      expect(report.productSalesRanking[0]).toEqual({
        productId: 'prod-chaufa',
        productName: 'Arroz Chaufa Especial',
        quantitySold: 3,
        totalRevenue: 73.5,
      });

      // Auditoría de turno
      expect(report.shiftsAudit[0].difference).toBe(0.0);
    });

    it('debe generar la Pre-Cuenta con desglose de subtotal base e IGV al centavo', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-pre-1',
        orderNumber: 'ORD-500',
        tenantId: 'chifa-mariana',
        tableNumber: 'Mesa 4',
        orderType: 'DINE_IN',
        status: 'SERVED',
        totalAmount: 59.0,
        items: [
          {
            id: 'it-1',
            productName: 'Aeropuerto Especial',
            quantity: 2,
            unitPrice: 29.5,
            subtotal: 59.0,
          },
        ],
      });

      const preBill = await service.getPreBill('chifa-mariana', 'ord-pre-1');
      expect(preBill.totalAmount).toBe(59.0);
      expect(preBill.subtotalBase).toBe(50.0);
      expect(preBill.igvAmount).toBe(9.0);
    });
  });
});
