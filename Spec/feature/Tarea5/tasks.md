# Checklist de Tareas Ejecutables: [Tarea 5] Módulo de Cobranza, Arqueo de Caja & Auditoría Financiera

## 1. Base de Datos & Migraciones Seguras (`BE-01`)
- [x] **BE-01**: Crear migración `backend/src/core/database/migrations/005-payments-audit-schema.sql` con tabla `payments` (`tenant_id`, `order_id`, `shift_id`, `cashier_user_id`, `payment_method`, `receipt_type`, `receipt_number`, `amount`, `received_amount`, `change_given`, `operation_code`, `customer_document`, `customer_name`, `paid_at`, `deleted_at`) e índices compuestos para analítica financiera.

## 2. Backend NestJS: Entidades, Servicios y Controladores (`BE-02` - `BE-06`)
- [x] **BE-02**: Implementar entidad `Payment` (`payment.entity.ts`) y DTO `CreatePaymentDto` (`create-payment.dto.ts`) con validaciones financieras (`DECIMAL(12, 2)`, `@DeleteDateColumn`).
- [x] **BE-03**: Implementar `BillingService` (`billing.service.ts`) con:
  - `processPayment(tenantId, cashierUserId, dto)` (transacción atómica en `DataSource`, cálculo exacto de vuelto al centavo, incremento atómico de `shift.expectedCash` en pagos `CASH`, marcación de comanda `PAID` y emisión de evento `order.paid`).
  - `getPreBill(tenantId, orderId)` (desglose de pre-cuenta con subtotal, IGV referencial y total exacto).
  - `getPayments(tenantId, shiftId?)` (listado histórico de pagos por turno).
  - `getFinancialAudit(tenantId, query)` (KPIs consolidados, desglose por medio de pago, ranking de ventas por producto de carta e historial de arqueos de turno).
- [x] **BE-04**: Implementar `BillingController` (`billing.controller.ts`) y `BillingModule` (`billing.module.ts`) protegidos por `JwtAuthGuard`, `ShiftActiveGuard` y `RolesGuard`.
- [x] **BE-05**: Extender `ShiftsService` y `ShiftsController` con `GET /api/v1/shifts/history` para consultar el historial de turnos abiertos y cerrados del tenant.
- [x] **BE-06**: Registrar `Payment` en `DatabaseModule` y `BillingModule` en `AppModule`.

## 3. Frontend Next.js 16 (100% Web): Terminal POS de Caja & Auditoría (`FE-01` - `FE-04`)
- [x] **FE-01**: Extender `chifaApi` (`frontend/src/store/services/api.ts`) con `useProcessPaymentMutation`, `useGetPreBillQuery`, `useGetPaymentsQuery`, `useGetFinancialAuditQuery` y `useGetShiftsHistoryQuery`.
- [x] **FE-02**: Actualizar la Terminal POS de Caja (`frontend/src/app/caja/turno/page.tsx`) con:
  - Modal de **Pre-Cuenta** e impresión web para entregar a la mesa antes del pago.
  - Modal de **Cobranza Multi-Método** (`Efectivo` con botones rápidos de billetes `S/ 10`, `S/ 20`, `S/ 50`, `S/ 100`, `S/ 200` y cálculo en vivo de vuelto en `JetBrains Mono`; `Yape`, `Plin` y `Tarjeta` con código de operación).
  - Selector de comprobante (`TICKET`, `BOLETA`, `FACTURA`) y vista de comprobante emitido.
  - Panel en vivo de desglose de cobros del turno actual (Efectivo en Gaveta vs Digital Yape/Plin/Tarjeta).
- [x] **FE-03**: Crear el Panel de Auditoría Financiera, Arqueos & Ranking de Ventas (`frontend/src/app/admin/auditoria/page.tsx`) bajo estética **Executive Precision Dark**.
- [x] **FE-04**: Añadir accesos de navegación hacia `/admin/auditoria` y `/comandero` en las barras de navegación administrativa y de caja.

## 4. Pruebas Unitarias, Precisión Financiera y Seguridad (`QA-01` - `QA-04`)
- [x] **QA-01**: Crear suite unitaria `backend/src/modules/billing/billing.service.spec.ts` validando:
  - Cálculo exacto de vuelto al centavo en cobros en efectivo (`CASH`) e incremento de `expectedCash` en el turno activo.
  - Cobros digitales (`YAPE`, `PLIN`, `CARD`) con código de operación sin distorsionar el efectivo físico en gaveta (`expectedCash`).
  - Rechazo de pago cuando el efectivo recibido es menor al total de la cuenta o cuando la orden ya fue cobrada (`PAID`).
  - Cálculo exacto del Ranking de Ventas por Producto y Arqueo en `getFinancialAudit`.
- [x] **QA-02**: Ejecutar `npm test --prefix backend` verificando que el 100% de las suites pasen sin errores.
- [x] **QA-03**: Ejecutar `npm run build --prefix backend` y `npm run build --prefix frontend` verificando 0 errores de compilación.
- [x] **QA-04**: Ejecutar `npm run security:scan` (Gitleaks) verificando 0 secretos expuestos.
