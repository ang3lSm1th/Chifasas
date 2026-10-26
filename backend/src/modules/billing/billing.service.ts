import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  PreconditionFailedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Payment, PaymentMethod, ReceiptType } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { KdsGateway } from '../kds/kds.gateway';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderPaidEvent } from './events/order-paid.event';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    private readonly kdsGateway: KdsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Procesa el cobro de una comanda en Efectivo (con cálculo exacto de vuelto al centavo),
   * Yape, Plin o Tarjeta, actualiza el expected_cash del turno y emite el comprobante.
   */
  async processPayment(
    tenantId: string,
    user: { id: string; fullName?: string; username?: string },
    dto: CreatePaymentDto,
  ) {
    // 1. Verificar turno abierto en el tenant
    const activeShift = await this.shiftRepository.findOne({
      where: { tenantId, status: 'OPEN' },
    });

    if (!activeShift) {
      throw new PreconditionFailedException(
        'Operación bloqueada: No existe un turno abierto en Caja para procesar cobros.',
      );
    }

    // 2. Verificar existencia de la comanda en el tenant
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId },
      relations: { items: true, waiter: true },
    });

    if (!order) {
      throw new NotFoundException(
        `Comanda con ID '${dto.orderId}' no encontrada en este restaurante.`,
      );
    }

    if (order.status === 'PAID') {
      throw new ConflictException(
        `La comanda ${order.orderNumber} ya fue cobrada anteriormente.`,
      );
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException(
        `No se puede cobrar una comanda anulada (${order.orderNumber}).`,
      );
    }

    // 3. Aritmética exacta al centavo (Cents Integer Math)
    const amountCents = Math.round(Number(order.totalAmount) * 100);
    const amount = Number((amountCents / 100).toFixed(2));
    const paymentMethod: PaymentMethod = dto.paymentMethod;
    const receiptType: ReceiptType = dto.receiptType || 'TICKET';

    let cashReceived = amount;
    let changeGiven = 0;

    if (paymentMethod === 'CASH') {
      const rawCashReceived =
        dto.cashReceived !== undefined && dto.cashReceived !== null
          ? Number(dto.cashReceived)
          : amount;
      const cashReceivedCents = Math.round(rawCashReceived * 100);

      if (cashReceivedCents < amountCents) {
        throw new BadRequestException(
          `El efectivo recibido (S/ ${(cashReceivedCents / 100).toFixed(
            2,
          )}) es menor al total de la comanda (S/ ${amount.toFixed(2)}).`,
        );
      }

      const changeCents = cashReceivedCents - amountCents;
      cashReceived = Number((cashReceivedCents / 100).toFixed(2));
      changeGiven = Number((changeCents / 100).toFixed(2));

      // Incrementar atómicamente el efectivo esperado en la gaveta física al centavo
      const currentExpectedCents = Math.round(Number(activeShift.expectedCash) * 100);
      const nextExpectedCents = currentExpectedCents + amountCents;
      activeShift.expectedCash = Number((nextExpectedCents / 100).toFixed(2));
      await this.shiftRepository.save(activeShift);
    } else {
      // Pagos digitales: YAPE, PLIN, CARD
      cashReceived = amount;
      changeGiven = 0;
    }

    // 4. Generar número de comprobante correlativo
    const prefix =
      receiptType === 'BOLETA' ? 'B001' : receiptType === 'FACTURA' ? 'F001' : 'TK01';
    const timeCode = String(Date.now()).slice(-6);
    const receiptNumber = `${prefix}-${timeCode}`;
    const paidAt = new Date();

    const payment = this.paymentRepository.create({
      id: randomUUID(),
      tenantId,
      shiftId: String(activeShift.id),
      orderId: order.id,
      cashierId: user.id,
      receiptNumber,
      receiptType,
      paymentMethod,
      amount,
      cashReceived,
      changeGiven,
      operationCode: dto.operationCode?.trim() || null,
      customerDocument: dto.customerDocument?.trim() || null,
      customerName: dto.customerName?.trim() || order.customerName || 'Cliente General',
      notes: dto.notes?.trim() || null,
      paidAt,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // 5. Actualizar estado de la orden a PAID
    order.status = 'PAID';
    await this.orderRepository.save(order);
    await this.orderItemRepository.update(
      { orderId: order.id, tenantId },
      { kdsStatus: 'SERVED' },
    );

    // 6. Emitir evento de dominio y notificaciones WebSocket en tiempo real
    const paidEvent = new OrderPaidEvent(
      savedPayment.id,
      savedPayment.receiptNumber,
      tenantId,
      String(activeShift.id),
      order.id,
      user.id,
      paymentMethod,
      receiptType,
      amount,
      cashReceived,
      changeGiven,
      savedPayment.operationCode,
      paidAt,
    );
    this.eventEmitter.emit('order.paid', paidEvent);

    const wsPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: 'PAID',
      receiptNumber: savedPayment.receiptNumber,
      paymentMethod,
      amount,
      changeGiven,
      paidAt,
    };

    this.kdsGateway.notifyCashier(tenantId, 'order:status_updated', wsPayload);
    this.kdsGateway.notifyWaiters(tenantId, 'order:status_updated', wsPayload);

    this.logger.log(
      `[Cobranza POS] Comanda ${order.orderNumber} cobrada (${paymentMethod}) Comprobante ${receiptNumber} | Total: S/ ${amount.toFixed(
        2,
      )} | Vuelto: S/ ${changeGiven.toFixed(2)}`,
    );

    return {
      payment: savedPayment,
      order,
      shiftExpectedCash: Number(activeShift.expectedCash),
    };
  }

  /**
   * Genera la Pre-Cuenta detallada de una mesa/orden para revisión previa al cobro.
   */
  async getPreBill(tenantId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
      relations: { items: true, waiter: true },
    });

    if (!order) {
      throw new NotFoundException(`Comanda con ID '${orderId}' no encontrada.`);
    }

    const totalCents = Math.round(Number(order.totalAmount) * 100);
    const total = Number((totalCents / 100).toFixed(2));
    // Desglose referencial IGV (18% incluido)
    const subtotalBase = Number((total / 1.18).toFixed(2));
    const igvAmount = Number((total - subtotalBase).toFixed(2));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || 'Salón',
      orderType: order.orderType,
      waiterName: order.waiter?.fullName || 'Salón',
      createdAt: order.createdAt,
      status: order.status,
      items: (order.items || []).map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        notes: item.notes,
      })),
      subtotalBase,
      igvAmount,
      totalAmount: total,
    };
  }

  /**
   * Lista el historial de cobros y comprobantes emitidos por el restaurante.
   */
  async getPaymentsHistory(tenantId: string, shiftId?: string) {
    const where: any = { tenantId };
    if (shiftId) {
      where.shiftId = shiftId;
    }

    return this.paymentRepository.find({
      where,
      relations: { order: true, cashier: true },
      order: { paidAt: 'DESC' },
      take: 150,
    });
  }

  /**
   * Genera el Reporte de Auditoría Financiera, Ventas por Producto, Consolidado por
   * Método de Pago (Efectivo, Yape, Plin, Tarjeta) y Balance de Arqueos de Turno.
   */
  async getFinancialAuditReport(
    tenantId: string,
    filters?: { shiftId?: string; startDate?: string; endDate?: string },
  ) {
    const paymentWhere: any = { tenantId };

    if (filters?.shiftId) {
      paymentWhere.shiftId = filters.shiftId;
    } else if (filters?.startDate && filters?.endDate) {
      const start = new Date(`${filters.startDate}T00:00:00.000Z`);
      const end = new Date(`${filters.endDate}T23:59:59.999Z`);
      paymentWhere.paidAt = Between(start, end);
    }

    const payments = await this.paymentRepository.find({
      where: paymentWhere,
      relations: { order: { items: true }, cashier: true },
      order: { paidAt: 'DESC' },
    });

    // 1. Consolidado por método de pago con precisión al centavo
    const byMethodCents: Record<PaymentMethod, { count: number; totalCents: number }> = {
      CASH: { count: 0, totalCents: 0 },
      YAPE: { count: 0, totalCents: 0 },
      PLIN: { count: 0, totalCents: 0 },
      CARD: { count: 0, totalCents: 0 },
    };

    const byReceiptType: Record<ReceiptType, { count: number; totalCents: number }> = {
      TICKET: { count: 0, totalCents: 0 },
      BOLETA: { count: 0, totalCents: 0 },
      FACTURA: { count: 0, totalCents: 0 },
    };

    let totalRevenueCents = 0;
    const productStatsMap = new Map<
      string,
      { productId: string; productName: string; quantitySold: number; revenueCents: number }
    >();

    for (const p of payments) {
      const amtCents = Math.round(Number(p.amount) * 100);
      totalRevenueCents += amtCents;

      const method = (p.paymentMethod || 'CASH') as PaymentMethod;
      if (byMethodCents[method]) {
        byMethodCents[method].count += 1;
        byMethodCents[method].totalCents += amtCents;
      }

      const rType = (p.receiptType || 'TICKET') as ReceiptType;
      if (byReceiptType[rType]) {
        byReceiptType[rType].count += 1;
        byReceiptType[rType].totalCents += amtCents;
      }

      // Agregar ventas por producto de las órdenes cobradas
      const items = p.order?.items || [];
      for (const item of items) {
        const subCents = Math.round(Number(item.subtotal) * 100);
        const existing = productStatsMap.get(item.productId);
        if (existing) {
          existing.quantitySold += Number(item.quantity);
          existing.revenueCents += subCents;
        } else {
          productStatsMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            quantitySold: Number(item.quantity),
            revenueCents: subCents,
          });
        }
      }
    }

    const totalRevenue = Number((totalRevenueCents / 100).toFixed(2));
    const totalTransactions = payments.length;
    const averageTicket =
      totalTransactions > 0
        ? Number((totalRevenueCents / totalTransactions / 100).toFixed(2))
        : 0;

    const paymentMethodsBreakdown = {
      CASH: {
        count: byMethodCents.CASH.count,
        total: Number((byMethodCents.CASH.totalCents / 100).toFixed(2)),
      },
      YAPE: {
        count: byMethodCents.YAPE.count,
        total: Number((byMethodCents.YAPE.totalCents / 100).toFixed(2)),
      },
      PLIN: {
        count: byMethodCents.PLIN.count,
        total: Number((byMethodCents.PLIN.totalCents / 100).toFixed(2)),
      },
      CARD: {
        count: byMethodCents.CARD.count,
        total: Number((byMethodCents.CARD.totalCents / 100).toFixed(2)),
      },
    };

    const digitalTotalCents =
      byMethodCents.YAPE.totalCents +
      byMethodCents.PLIN.totalCents +
      byMethodCents.CARD.totalCents;

    // 2. Ranking de productos vendidos ordenado por ingresos
    const productSalesRanking = Array.from(productStatsMap.values())
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: item.quantitySold,
        totalRevenue: Number((item.revenueCents / 100).toFixed(2)),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 3. Historial de turnos y arqueos del restaurante
    const shiftsHistory = await this.shiftRepository.find({
      where: { tenantId },
      relations: { openedBy: true, closedBy: true },
      order: { openedAt: 'DESC' },
      take: 30,
    });

    return {
      summary: {
        totalRevenue,
        cashRevenue: paymentMethodsBreakdown.CASH.total,
        digitalRevenue: Number((digitalTotalCents / 100).toFixed(2)),
        totalTransactions,
        averageTicket,
      },
      paymentMethodsBreakdown,
      receiptsBreakdown: {
        TICKET: {
          count: byReceiptType.TICKET.count,
          total: Number((byReceiptType.TICKET.totalCents / 100).toFixed(2)),
        },
        BOLETA: {
          count: byReceiptType.BOLETA.count,
          total: Number((byReceiptType.BOLETA.totalCents / 100).toFixed(2)),
        },
        FACTURA: {
          count: byReceiptType.FACTURA.count,
          total: Number((byReceiptType.FACTURA.totalCents / 100).toFixed(2)),
        },
      },
      productSalesRanking,
      shiftsAudit: shiftsHistory.map((s) => ({
        id: s.id,
        status: s.status,
        openedBy: s.openedBy?.fullName || s.openedById,
        closedBy: s.closedBy?.fullName || s.closedById || null,
        initialCash: Number(s.initialCash),
        expectedCash: Number(s.expectedCash),
        declaredCash: s.declaredCash !== null ? Number(s.declaredCash) : null,
        difference: s.difference !== null ? Number(s.difference) : null,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        notes: s.notes,
      })),
      recentPayments: payments.slice(0, 50),
    };
  }
}
