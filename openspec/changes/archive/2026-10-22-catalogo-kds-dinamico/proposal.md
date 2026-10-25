# Proposal: Catálogo Jerárquico, Stock de Bebidas y Pantallas KDS Dinámicas

## Why

Actualmente el sistema cuenta con autenticación multi-tenant y control de turnos de caja, pero carece de un catálogo estructurado de productos y de un mecanismo para enrutar los pedidos de cocina hacia pantallas operativas. Los restaurantes chifa y pollerías requieren organizar su carta en comidas y bebidas, controlar el stock finito de bebidas en tiempo real para evitar vender productos agotados, y disponer de múltiples estaciones de cocina dinámicas (ej. Wok, Broaster, Bar) donde cada cocinero visualice solo lo que le corresponde preparar, mientras que Caja recibe obligatoriamente la comanda consolidada e íntegra para fines de cobro y pre-cuenta.

## What Changes

- **Gestión Dinámica de Pantallas KDS (1..N)**: Capacidad para que el administrador de cada tenant cree y configure estaciones de preparación ilimitadas con nombres y colores distintivos (ej. "Woks", "Plancha", "Freidoras", "Barra").
- **Catálogo Jerárquico de Productos**: Estructura de categorías y subcategorías diferenciando Comidas de Bebidas, con asignación de cada plato a una pantalla KDS específica.
- **Despacho Inmutable a Caja y Enrutamiento a Cocina**: Al confirmarse un pedido, el despachador enruta cada ítem a su pantalla KDS asignada y **siempre y sin excepción** despacha el pedido íntegro y consolidado a la sala WebSocket de Caja.
- **Control Atómico de Inventario de Bebidas**: Gestión de stock para bebidas con decremento transaccional, registro de movimientos en auditoría y bloqueo de adición al comandero cuando el stock llegue a 0.
- **Interfaces Web Reactivas**: SPAs en Next.js para administración de pantallas KDS (`/admin/pantallas-kds`), catálogo de carta (`/admin/carta`), inventario (`/admin/inventario`) y visualizador dinámico de cocina KDS (`/kds/[stationId]`) con soporte táctil y diseño Executive Precision Dark.

## Capabilities

### New Capabilities
- `kds-management`: Creación, edición, listado y configuración de estaciones KDS dinámicas por tenant, con salas WebSocket dedicadas.
- `menu-catalog`: Organización jerárquica de la carta (categorías, subcategorías, comidas y bebidas) y asociación de platos con su estación KDS.
- `order-dispatch`: Enrutamiento en tiempo real de ítems de comanda a pantallas KDS específicas con réplica obligatoria e inmutable a la terminal de Caja.
- `inventory-control`: Monitoreo y descuento transaccional del stock de bebidas, alertas de agotamiento y bloqueo de pedidos sin inventario disponible.

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- **Backend (`backend/`)**:
  - Nuevas entidades TypeORM: `KdsStation`, `Category`, `Subcategory`, `Product`, `InventoryMovement`.
  - Módulos NestJS: `KdsStationsModule`, `CatalogModule`, `InventoryModule`, `OrderDispatcherService`.
  - Eventos de dominio vía `EventEmitter2` y WebSockets en tiempo real con Socket.IO / Gateway de NestJS.
- **Frontend (`frontend/`)**:
  - Nuevos slices RTK: `kdsSlice`, `catalogSlice`, `inventorySlice`.
  - Nuevas rutas SPA: `/admin/pantallas-kds`, `/admin/carta`, `/admin/inventario` y `/kds/[stationId]`.
- **Base de Datos (`MySQL`)**:
  - Nueva migración `003-catalog-kds-inventory.sql` con claves foráneas protegidas, soft-deletes y relaciones con `tenants`.
