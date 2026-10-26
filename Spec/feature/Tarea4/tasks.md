# Desglose de Tareas Técnicas - Tarea 4: Comandero Web para Celulares y Despacho Concurrente

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [x] **ORQ-01**: Validar el modelo relacional de `orders` y `order_items` con aislamiento estricto por `tenant_id` y borrado lógico (`deleted_at`).
- [x] **ORQ-02**: Verificar la integración de `ShiftActiveGuard` (`412 Precondition Failed`) y la extracción exclusiva de `tenant_id` desde la sesión autenticada.
- [x] **ORQ-03**: Supervisar el **Loop de Rectificación** y validar los criterios de aceptación de la Fase 4.

---

## 2. Tareas del Desarrollador Backend (NestJS, MySQL, EventBus & WebSockets)
- [x] **BE-01**: Crear migración `004-orders-schema.sql` para las tablas `orders` y `order_items` con índices por `(tenant_id, status)` y `(tenant_id, table_number)`.
- [x] **BE-02**: Implementar entidades TypeORM `Order` y `OrderItem` con `@DeleteDateColumn()` y registrarlas en `DatabaseModule` (`synchronize: false`).
- [x] **BE-03**: Implementar `OrdersService` y `OrderCreatedEvent`:
  - Validación de productos por `tenant_id`.
  - Descuento atómico de stock de bebidas mediante `InventoryService.deductStock()`.
  - Generación de código correlativo legible (`ORD-XXXX`) y vinculación al turno abierto (`shift_id`).
  - Despacho dual en tiempo real a través de `OrderDispatcherService` (Pantallas KDS 1..N + Regla Inmutable a Caja) y emisión de `OrderCreatedEvent` en `EventEmitter2`.
- [x] **BE-04**: Implementar `OrdersController` (`/api/v1/orders`):
  - `POST /api/v1/orders` protegido con `AuthGuard`, `ShiftBoundSessionGuard` y `ShiftActiveGuard`.
  - `GET /api/v1/orders` y `GET /api/v1/orders/tables` para consulta de comandas activas y estado de mesas en salón/caja.
  - `PATCH /api/v1/orders/:id/status` para actualización de estado (`PENDING`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`) con notificación WebSocket a meseras y caja.
- [x] **BE-05**: Ampliar `KdsGateway` con soporte para sala de meseras (`join_waiters`) y difusión de cambios de estado de comandas en tiempo real.

---

## 3. Tareas del Desarrollador Frontend Web (Next.js SPAs, RTK & Executive Precision Dark)
- [x] **FE-01**: Implementar `cartSlice.ts` y `kdsSlice.ts` en Redux Toolkit (`frontend/src/store/slices/`):
  - Manejo atómico de carrito por mesa/modalidad, notas de preparación por ítem, validación de tope de stock y cálculo de totales.
- [x] **FE-02**: Extender `chifaApi` (`frontend/src/store/services/api.ts`) con endpoints de órdenes (`useCreateOrderMutation`, `useGetOrdersQuery`, `useGetTablesSummaryQuery`, `useUpdateOrderStatusMutation`).
- [x] **FE-03**: Construir la SPA **Comandero Web para Celulares (`/comandero`)**:
  - Diseño **Executive Precision Dark** con tipografía `Inter` y `JetBrains Mono` en montos, códigos y contadores.
  - Botones táctiles ergonómicos (`>= 48px`) con microinteracción spring `active:scale-[0.97]` de Emil Kowalski.
  - Selector rápido de Mesas (`Mesa 1..12`), `Para Llevar` y `Delivery`.
  - Buscador instantáneo en memoria y filtro deslizable por categorías.
  - Indicador de stock de bebidas y badge de bloqueo `"AGOTADO"` cuando `currentStock <= 0`.
  - Drawer / Bottom Sheet táctil para revisión de comanda, chips rápidos de notas de cocina, vista previa de estaciones KDS de destino y botón de despacho inmediato.
  - Pestaña de seguimiento en vivo de comandas activas en salón con alerta sonora cuando cocina marca un pedido como `LISTO`.
- [x] **FE-04**: Integrar recepción en tiempo real de comandas en `/caja/turno` (monitor de comandas recibidas en Caja vía WebSocket + API) y enlaces de navegación a `/comandero` en todas las vistas operativas.

---

## 4. Tareas del Tester / QA Senior (Concurrencia, Seguridad y Ergonomía Móvil)
- [x] **QA-01 (Prueba de Despacho Concurrente y Regla Inmutable a Caja)**:
  - Verificado en `orders.service.spec.ts`: Emisión de pedidos mixtos y concurrentes fragmenta ítems a cada pantalla KDS y notifica íntegramente a Caja.
- [x] **QA-02 (Prueba de Bloqueo sin Turno Abierto - 412)**:
  - Verificado en `orders.service.spec.ts`: Con la caja cerrada el intento de crear una comanda retorna `412 Precondition Failed`.
- [x] **QA-03 (Prueba de Agotamiento de Stock en Concurrencia)**:
  - Verificado en `orders.service.spec.ts`: Bloqueo inmediato si una bebida no cuenta con stock suficiente, sin persistir ni emitir eventos.
- [x] **QA-04 (Prueba de Aislamiento Multi-Tenant en Pedidos)**:
  - Verificado en `orders.service.spec.ts`: Productos y órdenes de un tenant son inaccesibles desde otro tenant.

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [x] ¿El Orquestador Senior validó la arquitectura de `OrdersModule` y el cumplimiento de reglas inmutables? -> **Aprobado**.
- [x] ¿El Desarrollador Backend completó `OrdersModule`, `004-orders-schema.sql` y las notificaciones WebSocket? -> **Aprobado (38/38 tests vitest pasados)**.
- [x] ¿El Desarrollador Frontend construyó la SPA `/comandero` con `cartSlice` y ergonomía táctil móvil en `Executive Precision Dark`? -> **Aprobado (Build Next.js 16 exitoso)**.
- [x] ¿El Tester Senior ejecutó y aprobó el 100% de pruebas unitarias, de concurrencia y compilación? -> **Aprobado**.
