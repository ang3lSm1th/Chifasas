# inventory-control Specification

## Purpose

Permite controlar el inventario de bebidas en tiempo real con descuento atómico, registro de movimientos y bloqueo automático ante agotamiento de stock.

## Requirements

### Requirement: Descuento atómico de stock al confirmar pedido
El sistema SHALL descontar inmediatamente y de manera atómica la cantidad consumida del stock actual de cada bebida al confirmarse una comanda.

#### Scenario: Reducción exitosa de existencias
- **WHEN** se confirma una orden con 2 botellas de "Inca Kola 1.5L" con stock disponible de 10
- **THEN** el stock actual de la bebida disminuye atómicamente a 8 y se registra un movimiento de salida

### Requirement: Bloqueo de pedido por stock insuficiente o agotado
El sistema SHALL rechazar la confirmación de pedidos que incluyan bebidas cuyo stock disponible sea menor a la cantidad solicitada o igual a cero.

#### Scenario: Intento de compra con stock en cero
- **WHEN** un usuario intenta agregar o confirmar una bebida con stock disponible igual a 0
- **THEN** el sistema rechaza la operación con error 400 y mensaje de producto agotado
