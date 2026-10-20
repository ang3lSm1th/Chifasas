# Plan de Implementación Técnica - Tarea 3: Catálogo, Stock de Bebidas y Pantallas KDS Dinámicas

## 1. Arquitectura de Módulos (NestJS)

```
src/modules/
├── kds-stations/                     # Módulo de Pantallas KDS Dinámicas
│   ├── kds-stations.controller.ts
│   ├── kds-stations.service.ts
│   ├── entities/kds-station.entity.ts # Con tenant_id y @DeleteDateColumn()
│   └── dto/create-kds-station.dto.ts
├── catalog/                          # Categorías, Subcategorías y Productos
│   ├── catalog.controller.ts
│   ├── catalog.service.ts
│   ├── entities/
│   │   ├── category.entity.ts
│   │   ├── subcategory.entity.ts
│   │   └── product.entity.ts          # Relación con kds_station_id
│   └── dto/
│       ├── create-product.dto.ts
│       └── filter-catalog.dto.ts
└── inventory/                        # Control de Stock de Bebidas y Kardex
    ├── inventory.controller.ts
    ├── inventory.service.ts
    ├── entities/inventory-movement.entity.ts
    └── dto/adjust-stock.dto.ts
```

---

## 2. Lógica de Enrutamiento Dinámico KDS y Despacho Inmutable a Caja

### 2.1. Despacho Dual en el Servicio de Órdenes
```typescript
@Injectable()
export class OrderDispatcherService {
  constructor(
    private readonly wsGateway: WebSocketGateway,
    private readonly inventoryService: InventoryService
  ) {}

  async dispatchOrder(tenantId: string, order: Order): Promise<void> {
    // 1. Descuento atómico de stock para bebidas
    for (const item of order.items) {
      if (item.product.trackStock) {
        await this.inventoryService.deductStock(tenantId, item.productId, item.quantity);
      }
    }

    // 2. REGLA INMUTABLE: Notificación a Caja (recibe siempre el pedido completo)
    this.wsGateway.emitToRoom(
      `room:tenant_${tenantId}:cashier`,
      'order.received_in_cashier',
      { orderId: order.id, table: order.tableName, total: order.total, items: order.items }
    );

    // 3. Enrutamiento dinámico a pantallas KDS configuradas (Pantalla 1, Pantalla 2, etc.)
    const itemsByStation = this.groupItemsByKdsStation(order.items);
    for (const [stationId, items] of Object.entries(itemsByStation)) {
      this.wsGateway.emitToRoom(
        `room:tenant_${tenantId}:kds_${stationId}`,
        'order.items_to_prepare',
        { orderId: order.id, table: order.tableName, items }
      );
    }
  }

  private groupItemsByKdsStation(items: OrderItem[]): Record<string, OrderItem[]> {
    const grouped: Record<string, OrderItem[]> = {};
    for (const item of items) {
      const stationId = item.product.kdsStationId;
      if (stationId) {
        if (!grouped[stationId]) grouped[stationId] = [];
        grouped[stationId].push(item);
      }
    }
    return grouped;
  }
}
```

---

## 3. Frontend Descentralizado (Next.js SPAs con RTK & Executive Precision Dark)

### 3.1. Estado Global con Redux Toolkit (RTK)
- `kdsSlice`: Estado en memoria de las comandas activas recibidas vía WebSocket por estación, categorizadas por estados (`PENDIENTE`, `PREPARANDO`, `LISTO`).
- `catalogSlice`: Árbol jerárquico de categorías, subcategorías y productos con filtro rápido por buscador.
- `inventorySlice`: Estado de existencias numéricas de gaseosas y bebidas con semáforo de disponibilidad.
- `RTK Query`: Endpoints para gestión de estaciones KDS (`useGetKdsStationsQuery`, `useCreateKdsStationMutation`).

### 3.2. Diseño Visual & Interacción (Emil Kowalski)
- **Executive Precision Dark**:
  - Fondo Canvas `#0B0F17`, Tarjetas de Comanda `#131823` con bordes `#20293A`.
  - Cronómetro de comanda en `JetBrains Mono`: Verde `#10B981` (< 10 min), Ámbar `#D97706` (10-20 min), Rojo/Alerta (> 20 min).
  - Precios de carta y códigos en `JetBrains Mono`.
  - Animación de transición suave con spring physics (`cubic-bezier(0.16, 1, 0.3, 1)`) al mover una comanda de columna o marcarla como lista.
  - Alerta sonora suave (Web Audio API) y microinteracción táctil al recibir un nuevo plato en cocina.

---

## 4. Loop de Rectificación para Tarea 3
1. **Orquestador Senior**: Revisa el modelo relacional de KDS stations y garantiza el despacho inmutable a caja.
2. **Desarrollador Backend**: Comprueba la agrupación de ítems por estación y el bloqueo atómico de stock.
3. **Desarrollador Frontend**: Valida la fluidez táctil en la creación de platos y selección de pantalla KDS en `Executive Precision Dark`.
4. **Tester Senior**: Ejecuta pruebas de despacho enviando una comanda con platos destinados a múltiples pantallas KDS, comprobando la recepción exacta en cada una y en Caja.
5. **Memoria de Errores**: Registrar cualquier lección o desvío en `Spec/memory/error-log.md` de forma compacta.
