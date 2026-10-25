import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KdsGateway } from './kds.gateway';

export interface DispatchItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  kdsStationId?: string | null;
  notes?: string;
}

export interface DispatchOrderPayload {
  orderId: string;
  tenantId: string;
  tableNumber?: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  waiterId?: string;
  waiterName?: string;
  items: DispatchItem[];
  totalAmount: number;
  createdAt?: Date;
}

export interface DispatchResult {
  orderId: string;
  tenantId: string;
  cashierNotified: boolean;
  kdsStationsNotified: string[];
  totalItems: number;
}

@Injectable()
export class OrderDispatcherService {
  private readonly logger = new Logger(OrderDispatcherService.name);

  constructor(
    private readonly kdsGateway: KdsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Despacha una orden fragmentando los ítems a sus pantallas KDS correspondientes
   * y despachando SIEMPRE e INVARIABLEMENTE la totalidad de la orden a la sala de Caja.
   */
  async dispatchOrder(payload: DispatchOrderPayload): Promise<DispatchResult> {
    const { tenantId, orderId, items } = payload;
    const stationsMap = new Map<string, DispatchItem[]>();
    const stationsNotified: string[] = [];

    // 1. Fragmentación de ítems por estación KDS
    for (const item of items) {
      if (item.kdsStationId) {
        if (!stationsMap.has(item.kdsStationId)) {
          stationsMap.set(item.kdsStationId, []);
        }
        stationsMap.get(item.kdsStationId)!.push(item);
      }
    }

    // 2. Notificación en tiempo real a cada estación KDS
    for (const [stationId, stationItems] of stationsMap.entries()) {
      this.kdsGateway.notifyKdsStation(tenantId, stationId, 'kds:order_items', {
        orderId,
        tableNumber: payload.tableNumber,
        orderType: payload.orderType,
        waiterName: payload.waiterName,
        items: stationItems,
        dispatchedAt: new Date(),
      });
      stationsNotified.push(stationId);
    }

    // 3. REGLA INMUTABLE: Notificación de la orden completa y consolidada a Caja
    this.kdsGateway.notifyCashier(tenantId, 'cashier:order_ticket', {
      ...payload,
      dispatchedAt: new Date(),
    });

    // 4. Emitir evento de dominio para observabilidad y auditoría
    this.eventEmitter.emit('order.dispatched', {
      orderId,
      tenantId,
      totalAmount: payload.totalAmount,
      itemCount: items.length,
      stationsNotified,
    });

    this.logger.log(
      `[Despacho Dual] Orden #${orderId} (Tenant: ${tenantId}) enviada a ${stationsNotified.length} estación(es) KDS y a Caja obligatoriamente.`,
    );

    return {
      orderId,
      tenantId,
      cashierNotified: true,
      kdsStationsNotified: stationsNotified,
      totalItems: items.length,
    };
  }
}
