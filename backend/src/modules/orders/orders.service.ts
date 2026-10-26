import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem, OrderItemKdsStatus } from './entities/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ShiftsService } from '../shifts/shifts.service';
import { OrderDispatcherService, DispatchItem } from '../kds/order-dispatcher.service';
import { KdsGateway } from '../kds/kds.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderCreatedEvent } from './events/order-created.event';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly shiftsService: ShiftsService,
    private readonly orderDispatcherService: OrderDispatcherService,
    private readonly kdsGateway: KdsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Crea una nueva comanda desde el Comandero Web de Celulares, descuenta stock atómico
   * de bebidas, persiste en MySQL y despacha en paralelo a KDS 1..N e inmutablemente a Caja.
   */
  async createOrder(
    tenantId: string,
    user: { id: string; fullName?: string; username?: string },
    dto: CreateOrderDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La comanda debe incluir al menos un producto.');
    }

    // 1. Obtener el turno activo del tenant
    const currentShiftInfo = await this.shiftsService.getCurrentShift(tenantId);
    const activeShiftId =
      currentShiftInfo?.isShiftOpen && currentShiftInfo?.shift
        ? String(currentShiftInfo.shift.id)
        : null;

    // 2. Validar existencia de todos los productos dentro del tenant (Zero-Trust Multi-Tenant)
    const resolvedProducts = new Map<string, Product>();
    for (const itemDto of dto.items) {
      if (!resolvedProducts.has(itemDto.productId)) {
        const product = await this.productRepository.findOne({
          where: { id: itemDto.productId, tenantId, isActive: true },
          relations: { kdsStation: true },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto con ID '${itemDto.productId}' no existe o no está activo en este restaurante.`,
          );
        }
        resolvedProducts.set(itemDto.productId, product);
      }
    }

    // 3. Agregar cantidades por producto para validar y descontar stock atómico de bebidas
    const aggregatedQuantities = new Map<string, number>();
    for (const itemDto of dto.items) {
      const prev = aggregatedQuantities.get(itemDto.productId) || 0;
      aggregatedQuantities.set(itemDto.productId, prev + itemDto.quantity);
    }

    for (const [productId, totalQty] of aggregatedQuantities.entries()) {
      const product = resolvedProducts.get(productId)!;
      if (product.isBeverage) {
        await this.inventoryService.deductStock(tenantId, user.id, {
          productId: product.id,
          quantity: totalQty,
          notes: `Comanda ${dto.tableNumber || dto.orderType || 'Salón'}`,
        });
      }
    }

    // 4. Construir la entidad Order y sus OrderItems con precios oficiales del servidor
    const orderId = randomUUID();
    const shortCode = orderId.slice(0, 4).toUpperCase();
    const timeSuffix = String(Date.now()).slice(-4);
    const orderNumber = `ORD-${timeSuffix}-${shortCode}`;
    const orderType = dto.orderType || 'DINE_IN';
    const tableNumber =
      orderType === 'DINE_IN'
        ? dto.tableNumber || 'Mesa 1'
        : orderType === 'TAKEAWAY'
        ? dto.tableNumber || 'Para Llevar'
        : dto.tableNumber || 'Delivery';

    let totalAmount = 0;
    const orderItemsEntities: OrderItem[] = [];
    const dispatchItems: DispatchItem[] = [];

    for (const itemDto of dto.items) {
      const product = resolvedProducts.get(itemDto.productId)!;
      const unitPrice = Number(product.price);
      const subtotal = Number((unitPrice * itemDto.quantity).toFixed(2));
      totalAmount = Number((totalAmount + subtotal).toFixed(2));

      const orderItem = this.orderItemRepository.create({
        tenantId,
        orderId,
        productId: product.id,
        kdsStationId: product.kdsStationId || null,
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice,
        subtotal,
        notes: itemDto.notes?.trim() || null,
        kdsStatus: 'PENDING',
      });
      orderItemsEntities.push(orderItem);

      dispatchItems.push({
        productId: product.id,
        productName: product.name,
        quantity: itemDto.quantity,
        price: unitPrice,
        kdsStationId: product.kdsStationId || null,
        notes: itemDto.notes?.trim() || undefined,
      });
    }

    const orderEntity = this.orderRepository.create({
      id: orderId,
      tenantId,
      shiftId: activeShiftId,
      waiterId: user.id,
      orderNumber,
      orderType,
      tableNumber,
      customerName: dto.customerName?.trim() || null,
      status: 'PENDING',
      totalAmount,
      notes: dto.notes?.trim() || null,
      items: orderItemsEntities,
    });

    const savedOrder = await this.orderRepository.save(orderEntity);
    const waiterName = user.fullName || user.username || 'Mesera';

    // 5. Despacho Concurrente: Pantallas KDS 1..N + Regla Inmutable a Caja
    const dispatchResult = await this.orderDispatcherService.dispatchOrder({
      orderId: savedOrder.id,
      tenantId,
      tableNumber,
      orderType,
      waiterId: user.id,
      waiterName,
      items: dispatchItems,
      totalAmount,
      createdAt: savedOrder.createdAt || new Date(),
    });

    // 6. Emitir OrderCreatedEvent en EventEmitter2 y notificar sala de meseras
    const createdEvent = new OrderCreatedEvent(
      savedOrder.id,
      savedOrder.orderNumber,
      tenantId,
      activeShiftId,
      user.id,
      waiterName,
      orderType,
      tableNumber,
      dispatchItems,
      totalAmount,
      savedOrder.createdAt || new Date(),
    );
    this.eventEmitter.emit('order.created', createdEvent);

    this.kdsGateway.notifyWaiters(tenantId, 'order:created', {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      tableNumber,
      orderType,
      waiterName,
      totalAmount,
      status: savedOrder.status,
      items: dispatchItems,
      createdAt: savedOrder.createdAt || new Date(),
    });

    this.logger.log(
      `[Comandero Web] Comanda ${savedOrder.orderNumber} (${tableNumber}) por S/ ${totalAmount.toFixed(2)} creada y despachada.`,
    );

    return {
      order: savedOrder,
      dispatch: dispatchResult,
    };
  }

  /**
   * Lista las comandas del tenant autenticado con filtros opcionales.
   */
  async findAllOrders(
    tenantId: string,
    filters?: { status?: string; tableNumber?: string; activeOnly?: boolean },
  ): Promise<Order[]> {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    } else if (filters?.activeOnly) {
      where.status = In(['PENDING', 'PREPARING', 'READY', 'SERVED']);
    }

    if (filters?.tableNumber) {
      where.tableNumber = filters.tableNumber;
    }

    return this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { items: true, waiter: true },
      take: 100,
    });
  }

  /**
   * Obtiene el detalle de una comanda garantizando aislamiento por tenant_id.
   */
  async findOneOrder(tenantId: string, id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: { items: true, waiter: true },
    });

    if (!order) {
      throw new NotFoundException(`Comanda con ID '${id}' no encontrada en este restaurante.`);
    }

    return order;
  }

  /**
   * Resumen en tiempo real de mesas del salón y sus órdenes activas.
   */
  async getTablesSummary(tenantId: string) {
    const activeOrders = await this.orderRepository.find({
      where: {
        tenantId,
        status: In(['PENDING', 'PREPARING', 'READY', 'SERVED']),
      },
      relations: { items: true, waiter: true },
      order: { createdAt: 'DESC' },
    });

    const defaultTables = Array.from({ length: 12 }, (_, idx) => `Mesa ${idx + 1}`);

    const tables = defaultTables.map((tableName) => {
      const tableOrders = activeOrders.filter((o) => o.tableNumber === tableName);
      const accumulatedTotal = tableOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0),
        0,
      );
      const hasReadyOrder = tableOrders.some((o) => o.status === 'READY');
      const hasPendingOrPreparing = tableOrders.some(
        (o) => o.status === 'PENDING' || o.status === 'PREPARING',
      );

      let tableState: 'FREE' | 'OCCUPIED' | 'READY_TO_SERVE' = 'FREE';
      if (hasReadyOrder) {
        tableState = 'READY_TO_SERVE';
      } else if (tableOrders.length > 0 || hasPendingOrPreparing) {
        tableState = 'OCCUPIED';
      }

      return {
        tableNumber: tableName,
        state: tableState,
        activeOrdersCount: tableOrders.length,
        accumulatedTotal: Number(accumulatedTotal.toFixed(2)),
        latestOrder: tableOrders[0] || null,
      };
    });

    return {
      tables,
      activeOrdersCount: activeOrders.length,
    };
  }

  /**
   * Actualiza el estado de una comanda y notifica en tiempo real a Meseras y Caja.
   */
  async updateOrderStatus(
    tenantId: string,
    id: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOneOrder(tenantId, id);
    order.status = status;

    if (status === 'READY' || status === 'SERVED') {
      const itemStatus: OrderItemKdsStatus = status === 'READY' ? 'READY' : 'SERVED';
      await this.orderItemRepository.update(
        { orderId: order.id, tenantId },
        { kdsStatus: itemStatus },
      );
      if (order.items) {
        order.items = order.items.map((i) => ({ ...i, kdsStatus: itemStatus }));
      }
    }

    const updated = await this.orderRepository.save(order);

    const payload = {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      tableNumber: updated.tableNumber,
      orderType: updated.orderType,
      status: updated.status,
      totalAmount: Number(updated.totalAmount),
      updatedAt: new Date(),
    };

    this.kdsGateway.notifyWaiters(tenantId, 'order:status_updated', payload);
    this.kdsGateway.notifyCashier(tenantId, 'order:status_updated', payload);

    return updated;
  }

  /**
   * Actualiza el estado KDS de un ítem específico de la comanda.
   */
  async updateOrderItemStatus(
    tenantId: string,
    orderId: string,
    itemId: string,
    kdsStatus: OrderItemKdsStatus,
  ) {
    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId, tenantId },
    });

    if (!item) {
      throw new NotFoundException(`Ítem de comanda #${itemId} no encontrado.`);
    }

    item.kdsStatus = kdsStatus;
    await this.orderItemRepository.save(item);

    return item;
  }
}
