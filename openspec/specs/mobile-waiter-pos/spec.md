# mobile-waiter-pos Specification

## Purpose

Proporciona el comandero 100% web optimizado para teléfonos celulares de meseras con carrito reactivo en Redux Toolkit (`cartSlice`), buscador instantáneo, protección de turno activo (`412 Precondition Failed`) y despacho concurrente en tiempo real hacia Pantallas KDS dinámicas y Caja.

## Requirements

### Requirement: Toma de pedidos móvil 100% web con ergonomía táctil
El sistema SHALL ofrecer una interfaz web responsive en `/comandero` con controles táctiles de al menos 48px, buscador instantáneo en memoria, selector de mesas/modalidad y gestión de carrito en `cartSlice` bajo el sistema visual Executive Precision Dark.

#### Scenario: Adición táctil de platos y bebidas con notas de cocina
- **WHEN** una mesera selecciona una mesa, filtra productos con el buscador instantáneo y agrega platos con modificadores (ej. "Sin cebolla")
- **THEN** el `cartSlice` actualiza atómicamente los subtotales en `JetBrains Mono` y previsualiza las estaciones KDS de destino sin recargar la página

### Requirement: Bloqueo de comandas sin turno de caja abierto
El sistema SHALL rechazar cualquier intento de emisión de comanda cuando el restaurante (`tenant_id`) no tenga un turno de caja en estado `OPEN`.

#### Scenario: Intento de envío de comanda con caja cerrada
- **WHEN** se envía una petición `POST /api/v1/orders` sin existir un turno `OPEN` para el tenant autenticado
- **THEN** el backend responde con código HTTP `412 Precondition Failed` e impide el registro del pedido

### Requirement: Despacho concurrente con descuento atómico y copia inmutable a Caja
El sistema SHALL descontar atómicamente el stock de bebidas al confirmar la comanda, emitir `OrderCreatedEvent` y despachar en paralelo los ítems fragmentados a sus pantallas KDS y la orden completa a la sala WebSocket de Caja.

#### Scenario: Confirmación de comanda mixta desde celular de mesera
- **WHEN** la mesera confirma un pedido con comidas (asignadas a pantallas KDS) y bebidas (con control de stock)
- **THEN** el sistema descuenta el stock de las bebidas en transacción, persiste la orden en MySQL, notifica a las pantallas KDS correspondientes y envía la totalidad de la orden al terminal de Caja
