# Desglose de Tareas Técnicas - Tarea 2: Turnos de Caja y Motor de Sesión Atada al Turno

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [ ] **ORQ-01**: Validar la consistencia de la entidad `shifts` en MySQL con llaves foráneas a `tenants` y soft-deletes.
- [ ] **ORQ-02**: Verificar la regla de cálculo de ventana de gracia (2.5 horas post-cierre) para el motor de expiración de sesiones.
- [ ] **ORQ-03**: Supervisar el **Loop de Rectificación**: Revisar reporte del Tester y aprobar transición.

---

## 2. Tareas del Desarrollador Backend (NestJS & Better Auth)
- [ ] **BE-01**: Crear migración de BD para tabla `shifts` con índice compuesto `(tenant_id, status)`.
- [ ] **BE-02**: Implementar `ShiftsModule`:
  - Endpoint `POST /api/v1/shifts/open` con transacción serializable para evitar doble apertura de turno por tenant.
  - Endpoint `GET /api/v1/shifts/current` filtrando por el `tenant_id` en sesión.
  - Endpoint `POST /api/v1/shifts/close` con cálculo de discrepancia y asignación de `grace_expires_at = NOW() + 150 minutes`.
- [ ] **BE-03**: Implementar `ShiftBoundSessionGuard`:
  - Keep-alive automático de sesión en Better Auth mientras el turno esté `OPEN`.
  - Revocación forzada de sesión e invalidación de cookies al superar la ventana de gracia post-cierre (`grace_expires_at`).
- [ ] **BE-04**: Implementar `ShiftActiveGuard`:
  - Rechazar con `412 Precondition Failed` cualquier intento de creación de pedido si no existe turno abierto en el tenant.
- [ ] **BE-05**: Publicar eventos de dominio `ShiftOpenedEvent` y `ShiftClosedEvent` en el `EventEmitter2`.

---

## 3. Tareas del Desarrollador Frontend (Next.js SPAs)
- [ ] **FE-01**: Construir pantalla de control de turnos en la SPA de Caja (`/caja/turno`):
  - Formulario táctil para ingreso de fondo inicial.
  - Badge visual de estado en tiempo real.
  - Modal de cierre y arqueo con desglose de montos.
- [ ] **FE-02**: Adaptar la SPA de Comandero de Meseras:
  - Escuchar cambios en el estado del turno vía WebSockets o polling ligero.
  - Deshabilitar el botón de toma de comanda y mostrar alerta explicativa si la caja está cerrada.
- [ ] **FE-03**: Manejo de expiración de sesión:
  - Redirección automática al `/login` con mensaje informativo cuando el interceptor responda 401 por fin de jornada post-cierre.

---

## 4. Tareas del Tester / QA Senior (Validación y Casos Borde)
- [ ] **QA-01 (Prueba de Sesión Prolongada en Turno Abierto)**:
  - Mantener sesión activa de mesera durante un turno simulado abierto; verificar que no ocurra expiración inesperada.
- [ ] **QA-02 (Prueba de Expiración Post-Cierre a las 2-3h)**:
  - Cerrar turno formalmente.
  - Simular avance del tiempo a 1 hora post-cierre -> Validar que la sesión continúa activa.
  - Simular avance del tiempo a 2 horas y 31 minutos post-cierre -> Validar que la siguiente petición es rechazada con `401 Unauthorized` y sesión revocada.
- [ ] **QA-03 (Prueba de Bloqueo de Pedidos sin Turno)**:
  - Intentar crear un pedido en mesa sin turno abierto -> Validar respuesta inmediata `412 Precondition Failed`.
- [ ] **QA-04 (Prueba de Concurrencia de Turnos)**:
  - Intentar abrir dos turnos en paralelo para el mismo restaurante -> Validar que el segundo intento retorne `409 Conflict`.

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [ ] ¿El Orquestador Senior aprobó el diseño de turnos y la regla de gracia de sesiones?
- [ ] ¿El Desarrollador Backend validó el keep-alive y el bloqueo del `ShiftActiveGuard`?
- [ ] ¿El Desarrollador Frontend implementó los estados visuales en Caja y Comandero?
- [ ] ¿El Tester Senior validó la persistencia de sesión en turno abierto y la caducidad post-cierre?
