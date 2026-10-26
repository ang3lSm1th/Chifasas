# billing-audit Specification

## Purpose

Garantiza el cobro exacto de comandas en el Terminal de Caja Web (Efectivo con cálculo de vuelto, Yape, Plin y Tarjetas), el cuadre de arqueo de turno al centavo y la auditoría financiera inmutable de ventas por producto y jornada.

## Requirements

### Requirement: Cobranza multi-método con cálculo de vuelto e impacto al centavo en caja
El sistema SHALL permitir liquidar comandas activas mediante Efectivo (`CASH`), `YAPE`, `PLIN` o Tarjeta (`CARD`), calculando el vuelto exacto al centavo para pagos en efectivo e incrementando atómicamente el efectivo esperado del turno activo.

#### Scenario: Cobro en efectivo con cálculo de vuelto
- **WHEN** el cajero cobra en efectivo una comanda de `S/ 42.50` recibiendo un billete de `S/ 50.00`
- **THEN** el sistema registra el pago, calcula un vuelto exacto de `S/ 7.50`, incrementa `expected_cash` del turno en `S/ 42.50` y cambia el estado de la orden a `PAID`

#### Scenario: Cobro digital con Yape, Plin o Tarjeta
- **WHEN** el cajero liquida una comanda mediante `YAPE`, `PLIN` o `CARD` indicando el código de operación
- **THEN** el sistema registra el comprobante con su referencia de operación, marca la orden como `PAID` y contabiliza el ingreso en el rubro digital sin alterar el efectivo físico esperado en gaveta

### Requirement: Reportes analíticos e historial inmutable de arqueos
El sistema SHALL proveer reportes financieros consolidados por fecha y turno, incluyendo el ranking de ventas por producto, el desglose por medio de pago y el historial inmutable de cierres y discrepancias de caja.

#### Scenario: Consulta de auditoría financiera por turno y fecha
- **WHEN** el administrador consulta el panel de auditoría financiera
- **THEN** el sistema retorna los ingresos desglosados por método de pago, las unidades y montos vendidos por cada producto y el balance de arqueo (`initial_cash`, `expected_cash`, `declared_cash`, `difference`) de cada turno
