# Design: Catálogo Jerárquico, Stock de Bebidas y Pantallas KDS Dinámicas

## Context

El sistema cuenta con aislamiento multi-inquilino en MySQL (`tenant_id`), autenticación Better Auth y control de turnos de caja en NestJS y Next.js. Ver `proposal.md` para la motivación.

Este cambio introduce el modelo de catálogo, control de stock y pantallas de cocina KDS 1..N que serán consumidas por las meseras y el terminal de cobro.

## Goals / Non-Goals

**Goals:**
- Permitir la creación dinámica de pantallas KDS (1..N) por tenant sin valores cableados en código.
- Garantizar que el despacho de pedidos divida los ítems a cada cocina correspondiente y notifique **siempre e inmutablemente a la sala de Caja**.
- Manejar inventario atómico de bebidas evitando sobreventas concurrentes.
- Proporcionar interfaces web táctiles y reactivas acordes al sistema de diseño *Executive Precision Dark*.

**Non-Goals:**
- Facturación electrónica SUNAT (corresponde a la Tarea 5 / Fase 5).
- Comandero web final de meseras (corresponde a la Tarea 4 / Fase 4; en esta fase se expone el endpoint y contratos de catálogo que el comandero consumirá).

## Decisions

### 1. Modelo de Datos Relacional y Soft-Deletes
- **Decisión**: Crear las tablas `kds_stations`, `categories`, `subcategories`, `products` e `inventory_movements` con clave foránea a `tenants(id)` y soporte de soft-deletes (`@DeleteDateColumn()`).
- **Alternativa descartada**: Almacenar categorías o pantallas KDS como JSON embebido. Se descartó porque rompería la integridad referencial y las consultas analíticas de ventas por estación.

### 2. Despacho Dual Inmutable (WebSockets + EventEmitter2)
- **Decisión**: Implementar `OrderDispatcherService` desacoplado mediante eventos de dominio (`OrderDispatchedEvent`). El gateway de WebSockets suscribe clientes a salas dinámicas con prefijo `room:tenant_{id}:kds_{stationId}` y `room:tenant_{id}:cashier`.
- **Regla Inmutable**: El despachador recorre los ítems, fragmenta por `kds_station_id`, y siempre emite el payload consolidado completo a `room:tenant_{id}:cashier`.
- **Alternativa descartada**: Enviar todos los ítems a una sala global y filtrar en frontend. Se descartó por fuga de información operativa y mayor consumo de ancho de banda en celulares.

### 3. Control de Stock Atómico y Prevención de Condiciones de Carrera
- **Decisión**: Decremento atómico en BD mediante `UPDATE products SET current_stock = current_stock - :qty WHERE id = :id AND current_stock >= :qty`. Si las filas afectadas son 0, lanzar `BadRequestException('Stock insuficiente o agotado')`.
- **Alternativa descartada**: Leer el stock con `SELECT`, verificar en memoria y luego hacer `UPDATE`. Se descartó porque bajo alta concurrencia provocaría ventas de stock negativo (race condition).

### 4. Arquitectura Frontend (SPAs Táctiles con RTK Query)
- **Decisión**: Centralizar el estado del catálogo, KDS e inventario en Redux Toolkit con RTK Query para invalidación automática de cache.
- **Ruta `/kds/[stationId]`**: Conexión reactiva a la sala específica de WebSocket, con tarjetas en `JetBrains Mono`, temporizador progresivo y transiciones táctiles `scale(0.97)` de Emil Kowalski.

## Risks / Trade-offs

- **[Riesgo] Pérdida de conexión en la pantalla de cocina durante el servicio** → *Mitigación*: Reconexión automática en el cliente Socket.IO y consulta de estado actual `GET /api/v1/kds/stations/:id/orders` al reconectar.
- **[Riesgo] Plato sin estación KDS asignada** → *Mitigación*: Validación en DTO de creación de productos; si no tiene estación asignada, se despacha a una estación KDS por defecto ("General") y a Caja.

## Migration Plan

1. Ejecutar migración SQL `003-catalog-kds-inventory.sql` en MySQL `chifa_saas`.
2. Actualizar `DatabaseModule` en NestJS registrando las nuevas entidades TypeORM.
3. Desplegar endpoints de NestJS (`kds-stations`, `catalog`, `inventory`).
4. Habilitar las rutas frontend en Next.js.
