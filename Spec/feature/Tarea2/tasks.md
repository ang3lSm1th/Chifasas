# Desglose de Tareas Técnicas - Tarea 2: Turnos de Caja y Motor de Sesión Atada al Turno

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [x] **ORQ-01**: Validar la consistencia de la entidad `shifts` en MySQL con llaves foráneas a `tenants` y soft-deletes.
- [x] **ORQ-02**: Verificar la regla de cálculo de ventana de gracia (2.5 horas post-cierre) para el motor de expiración de sesiones.
- [x] **ORQ-03**: Supervisar el **Loop de Rectificación**: Revisar reporte del Tester y aprobar transición.

---

## 2. Tareas del Desarrollador Backend (NestJS & Better Auth)
- [x] **BE-01**: Crear migración de BD para tabla `shifts` con índice compuesto `(tenant_id, status)` en `002-shifts-schema.sql`.
- [x] **BE-02**: Implementar `ShiftsModule`:
  - Endpoint `POST /api/v1/shifts/open` con verificación de turno activo previo y rechazo 409 si ya está abierto.
  - Endpoint `GET /api/v1/shifts/current` filtrando por el `tenant_id` en sesión.
  - Endpoint `POST /api/v1/shifts/close` con cálculo de discrepancia y asignación de `grace_expires_at = NOW() + 150 minutes` (2.5 horas).
- [x] **BE-03**: Implementar `ShiftBoundSessionGuard`:
  - Keep-alive transparente de sesión mientras el turno esté `OPEN`.
  - Revocación forzada de sesión e invalidación al superar la ventana de gracia post-cierre (`grace_expires_at`).
- [x] **BE-04**: Implementar `ShiftActiveGuard`:
  - Rechazar con `412 Precondition Failed` cualquier intento de creación de pedido si no existe turno abierto en el tenant.
- [x] **BE-05**: Publicar eventos de dominio `ShiftOpenedEvent` y `ShiftClosedEvent` en el `EventEmitter2`.

---

## 3. Tareas del Desarrollador Frontend (Next.js 100% Web)
- [x] **FE-01**: Construir pantalla de control de turnos en la SPA de Caja (`/caja/turno`):
  - Formulario táctil para ingreso de fondo inicial con botones rápidos (+S/50, +S/100, +S/150, +S/200).
  - Badge visual de estado en tiempo real (Pulsante verde en `OPEN`, naranja en Gracia, gris en Cerrado).
  - Modal de cierre y arqueo con desglose de montos y cálculo instantáneo de discrepancias.
- [x] **FE-02**: Adaptar la navegación y estado global:
  - `shiftSlice` en Redux Toolkit con estado de turno y ventana de gracia.
  - Enlace directo a `/caja/turno` desde la barra de herramientas de `/admin/trabajadores`.
- [x] **FE-03**: Manejo de expiración de sesión:
  - Banner explicativo sobre el estado del turno y advertencia de fin de jornada post-cierre.

---

## 4. Tareas del Tester / QA Senior (Validación y Casos Borde)
- [x] **QA-01 (Prueba de Sesión Prolongada en Turno Abierto)**:
  - Verificado en `shifts.service.spec.ts`: Turno `OPEN` permite acceso transparente sin desconexión.
- [x] **QA-02 (Prueba de Expiración Post-Cierre a las 2-3h)**:
  - Verificado en `shifts.service.spec.ts`: `grace_expires_at` se calcula a exactamente 150 minutos (2.5h) después de `closed_at`.
- [x] **QA-03 (Prueba de Bloqueo de Pedidos sin Turno)**:
  - Verificado en `shifts.service.spec.ts`: `ShiftActiveGuard` lanza `PreconditionFailedException` (412) ante intento sin turno abierto.
- [x] **QA-04 (Prueba de Concurrencia de Turnos)**:
  - Verificado en `shifts.service.spec.ts`: Apertura concurrente en un tenant con turno abierto retorna `ConflictException` (409).

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [x] ¿El Orquestador Senior aprobó el diseño de turnos y la regla de gracia de sesiones? -> **Aprobado**.
- [x] ¿El Desarrollador Backend validó el keep-alive y el bloqueo del `ShiftActiveGuard`? -> **Aprobado (10/10 tests vitest pasados)**.
- [x] ¿El Desarrollador Frontend implementó los estados visuales en Caja y Comandero? -> **Aprobado (Build Next.js exitoso)**.
- [x] ¿El Tester Senior validó la persistencia de sesión en turno abierto y la caducidad post-cierre? -> **Aprobado**.
