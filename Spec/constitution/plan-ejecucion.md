# Plan Maestro de Ejecución - Chifa Mariana SaaS (100% Web)

## 1. Principios Operativos del Equipo (Loop de Rectificación & Zero Token Waste)

```mermaid
flowchart TD
    START[Inicio de Tarea] --> PRE[0. Consulta de Spec/memory/error-log.md\nPrevenir errores conocidos / Ahorro de Tokens]
    PRE --> ORQ[1. Orquestador Senior\nValidación de Arquitectura, Contratos & Seguridad]
    ORQ --> DEV[2. Desarrolladores\nBackend NestJS / Better Auth + Frontend Web Next.js RTK]
    DEV --> QA[3. Tester / QA Senior\nPruebas Automatizadas, Penetración & Casos Borde]
    QA -->|Fallo / Vulnerabilidad / Bug| DEV
    QA -->|Aprobado al 100%| MEM[4. Registro de Aprendizaje Compacto\nActualizar error-log.md si hubo lecciones]
    MEM --> PASS[5. Aprobación Formal & Paso a Siguiente Tarea]
```

---

## 2. Cronograma Secuencial de Ejecución

### Fase 0: Aprovisionamiento de Seguridad, Secretos & Repositorio
* **Estado**: **COMPLETADA**
* **Logros**: Git inicializado, Gitleaks configurado con pre-commit en Husky, `init-db.sql` con usuario MySQL PoLP (`chifa_app` sin `DROP`/`TRUNCATE`), OpenBao configurado y commit inicial auditado.

---

### Fase 1: [Tarea 1] Fundaciones SaaS Multi-Tenancy, Better Auth & Gestión de Personal
* **Objetivo**: Establecer el Monolito Modular con aislamiento multi-inquilino y autenticación blindada 100% web.
* **Entregables**:
  1. **Backend**:
     - Estructura modular en NestJS (`core/openbao`, `core/database`, `modules/tenants`, `modules/users`).
     - `TenantContextInterceptor` con `AsyncLocalStorage` para inyectar automáticamente el filtro `tenant_id` en TypeORM (`synchronize: false` permanente, soft-deletes con `@DeleteDateColumn`).
     - Integración de **Better Auth** con plugin de Organizaciones.
     - Rate limiting estricto con `ThrottlerGuard` (máx 5 intentos / 5 min) y tiempo de respuesta constante contra *timing attacks*.
     - CRUD de trabajadores protegido exclusivamente para el rol `ADMIN` del tenant.
  2. **Frontend Web**:
     - SPA Web de autenticación en **Executive Precision Dark** (`#0B0F17`, `#131823`, `#2563EB`, `#10B981`, `#D97706`, `#757681`) con tipografía `Inter` y `JetBrains Mono`.
     - Configuración de **Redux Toolkit (RTK)** y **RTK Query** para `authSlice`.
     - Feedback táctil reactivo con principios de **Emil Kowalski** (`scale(0.97)` en botones, Sonner toasts).
     - SPA Web de gestión de trabajadores con modal reactivo.
* **Loop de Rectificación**: Tester ejecuta pruebas de aislamiento entre tenants (fuga de datos = 0), fuerza bruta (retorno de 429) y acceso restringido de personal no admin.

---

### Fase 2: [Tarea 2] Turnos de Caja Multi-Tenant & Motor de Sesión Atada al Turno
* **Objetivo**: Controlar la apertura/cierre de turnos y garantizar la persistencia de sesión web durante el servicio.
* **Entregables**:
  1. **Backend**:
     - Entidad `shifts` vinculada al `tenant_id` con cálculo de ventana de gracia (`grace_expires_at = closed_at + 150 min`).
     - `ShiftBoundSessionGuard`: keep-alive automático para meseras en celulares, cocineros y cajeros en turno `OPEN`; revocación forzada a las 2.5 horas post-cierre.
     - `ShiftActiveGuard`: bloqueo con `412 Precondition Failed` si se intenta crear pedidos sin turno abierto.
  2. **Frontend Web**:
     - `shiftSlice` en RTK con estado `isShiftOpen` global.
     - Modal de apertura de turno con teclado numérico en fuente `JetBrains Mono`.
     - Badge pulsante de estado en el header (`#10B981` abierto / `#D97706` cerrado).
* **Loop de Rectificación**: Tester simula avance de tiempo para validar expiración tras 2.5h post-cierre y verifica el bloqueo inviolable de pedidos sin turno.

---

### Fase 3: [Tarea 3] Catálogo Jerárquico, Stock de Bebidas & Pantallas KDS Dinámicas (1..N)
* **Objetivo**: Permitir al Administrador crear pantallas de cocina y configurar el enrutamiento de platos, con despacho inmutable a caja.
* **Entregables**:
  1. **Backend**:
     - Entidades `kds_stations`, `categories`, `subcategories`, `products`, `inventory_movements`.
     - CRUD de pantallas KDS dinámicas por tenant (Pantalla 1, 2, 3, ..., N).
     - Enrutamiento de cada plato a su pantalla KDS asignada.
     - **Regla Inmutable**: `OrderDispatcherService` notifica siempre al WebSocket de Caja (`room:tenant_{id}:cashier`) en paralelo a las salas KDS (`room:tenant_{id}:kds_{stationId}`).
     - Descuento atómico de stock de bebidas y bloqueo por agotamiento.
  2. **Frontend Web**:
     - Panel web de catálogo (Comidas vs Bebidas) y gestor visual de Pantallas KDS.
     - SPA de Cocina KDS dinámica (`/kds/[stationId]`) con transiciones spring de Emil Kowalski y alertas sonoras.
* **Loop de Rectificación**: Tester envía comanda mixta y verifica la fragmentación exacta a cada pantalla KDS y la recepción íntegra en Caja.

---

### Fase 4: [Tarea 4] Comandero Web para Celulares & Despacho Concurrente
* **Objetivo**: Comandero 100% web optimizado para teléfonos celulares de las meseras.
* **Entregables**:
  1. SPA Comandero táctil para navegadores móviles con `cartSlice` en RTK.
  2. Buscador instantáneo y despacho inmediato vía WebSocket a Caja y Cocinas.
* **Loop de Rectificación**: Pruebas de concurrencia y ergonomía táctil en múltiples resoluciones móviles.

---

### Fase 5: [Tarea 5] Módulo de Cobranza, Arqueo de Caja & Auditoría Financiera
* **Objetivo**: Control financiero integral, cobranza y arqueos inmutables en Caja web.
* **Entregables**:
  1. Terminal de Caja POS web para cobro en Efectivo (cálculo de vuelto), Yape, Plin y Tarjetas.
  2. Cierre formal de turno con balance de arqueo y registro de discrepancias.
  3. Historial analítico de ventas por producto y consolidados por fecha/turno.
* **Loop de Rectificación**: Validación de cuadre de caja al centavo contra registros en MySQL.

---

### Fase 6: [Tarea 6] Despliegue en Producción Cloud (AWS / VPS)
* **Objetivo**: Puesta en marcha en infraestructura cloud.
* **Entregables**:
  1. Orquestación completa con Docker Compose: NestJS Monolito, OpenBao, MySQL 8.0, Nginx con SSL y headers de seguridad.
  2. Documentación operativa y manual de despliegue en AWS / VPS.
* **Loop de Rectificación**: Auditoría final de seguridad y escaneo de vulnerabilidades previo al pase a producción.
