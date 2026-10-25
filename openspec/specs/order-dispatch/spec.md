# order-dispatch Specification

## Purpose

Garantiza el enrutamiento selectivo de platos hacia las estaciones KDS de cocina y el despacho obligatorio e inmutable de toda la comanda consolidada a Caja.

## Requirements

### Requirement: Enrutamiento segmentado a estaciones KDS
El sistema SHALL fragmentar los ítems de una comanda confirmada enviando cada producto exclusivamente a la estación KDS que tenga configurada.

#### Scenario: Fragmentación de pedido mixto
- **WHEN** se confirma una comanda con un "Arroz Chaufa" (destino Wok) y un "Pollo Broaster" (destino Freidora)
- **THEN** la estación Wok recibe únicamente el Chaufa y la estación Freidora recibe únicamente el Broaster

### Requirement: Despacho inmutable y obligatorio a Caja
El sistema SHALL notificar de manera inmutable y simultánea la totalidad de los ítems de cualquier comanda a la sala WebSocket de Caja.

#### Scenario: Recepción consolidada en Caja
- **WHEN** se despacha una comanda con ítems asignados a distintas pantallas de cocina
- **THEN** la terminal de Caja recibe el pedido completo con todos los ítems agregados para cobro y arqueo
