# Desglose de Tareas Técnicas - Tarea 1: Fundaciones SaaS Multi-Tenancy, Better Auth y Gestión de Personal

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [x] **ORQ-01**: Validar el modelo de datos multi-inquilino en MySQL asegurando aislamiento estricto por `tenant_id` y llaves foráneas.
- [x] **ORQ-02**: Diseñar la especificación de secretos en **OpenBao** (paths de credenciales de BD y llaves de Better Auth) garantizando que no existan `.env` planos.
- [x] **ORQ-03**: Verificar el script de MySQL para el usuario `chifa_app` garantizando el Principio de Menor Privilegio (PoLP sin `DROP` ni `TRUNCATE`).
- [x] **ORQ-04**: Configurar la política de **Gitleaks** en pre-commit con Husky y pipeline de CI/CD.
- [x] **ORQ-05**: Supervisar el **Loop de Rectificación**: Revisar reporte de seguridad del Tester y emitir aprobación formal.

---

## 2. Tareas del Desarrollador Backend (NestJS & Better Auth)
- [x] **BE-01**: Configurar proyecto NestJS bajo arquitectura de Monolito Modular con soporte Multi-Tenant en `backend/`.
- [x] **BE-02**: Implementar `OpenBaoModule` para inyección de secretos en memoria durante el bootstrap con fallback local seguro.
- [x] **BE-03**: Configurar conexión a MySQL con TypeORM:
  - `synchronize: false` permanente.
  - Script SQL de migración inicial con tablas `tenants`, `roles`, `users` y `login_attempts`.
  - Integración transversal de soft-deletes con `@DeleteDateColumn()`.
- [x] **BE-04**: Integrar autenticación blindada con Better Auth:
  - Configuración de sesiones seguras y cookies `HttpOnly`, `SameSite=Strict`.
  - Protecciones perimetrales anti-fuerza bruta (límite de 5 intentos por 5 minutos con respuesta 429).
  - Mitigación de timing attacks con `TimingSafeUtil` y mensajes genéricos unificados.
- [x] **BE-05**: Implementar `TenantContextInterceptor` con `AsyncLocalStorage` para inyectar automáticamente el filtro `tenant_id` en todas las consultas.
- [x] **BE-06**: Implementar `UsersModule`:
  - CRUD de trabajadores protegido por `RolesGuard(['ADMIN'])`.
  - Vinculación automática al `tenant_id` del usuario en sesión.

---

## 3. Tareas del Desarrollador Frontend (Next.js 100% Web)
- [x] **FE-01**: Configurar SPA base en Next.js con soporte multi-tenant (selector de restaurante y cabecera `x-tenant-id`) en `frontend/`.
- [x] **FE-02**: Implementar SPA de Login (`/login`) con paleta **Executive Precision Dark**:
  - Manejo de respuestas 429 con temporizador visual regresivo de bloqueo por intentos fallidos.
  - Soporte táctil ergonómico optimizado para celulares de salón y terminales de caja.
- [x] **FE-03**: Implementar SPA de Gestión de Trabajadores (`/admin/trabajadores`):
  - Vista restringida a usuarios con rol `ADMIN`.
  - Listado reactivo de personal con badges por rol y modal táctil para registrar nuevos empleados.
  - Integración completa con **Redux Toolkit (RTK)** y **RTK Query**.

---

## 4. Tareas del Tester / QA Senior (Seguridad & Multi-Tenancy)
- [x] **QA-01 (Prueba de Aislamiento Multi-Tenant)**:
  - Validar que las consultas requieran `tenantId` y no se filtren datos entre inquilinos.
- [x] **QA-02 (Prueba de Fuerza Bruta en Login)**:
  - Prueba automatizada en `auth.service.spec.ts`: Superados 5 intentos fallidos, el sistema responde `429 Too Many Requests`.
- [x] **QA-03 (Prueba de Integridad de BD y Anti-Eliminación)**:
  - Script `init-db.sql` configurado con permisos PoLP sin `DROP` ni `TRUNCATE` para `chifa_app`.
  - Soft-deletes implementados con `repository.softDelete(id)`.
- [x] **QA-04 (Prueba de Acceso Exclusivo de ADMIN a Personal)**:
  - `UsersController` protegido por `@Roles(RoleType.ADMIN)` y `RolesGuard`.
- [x] **QA-05 (Prueba de Detección de Secretos con Gitleaks)**:
  - Husky y Gitleaks interceptaron exitosamente commits con secretos simulados.

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [x] ¿El Orquestador Senior aprobó el aislamiento multi-tenant y la integración con OpenBao? -> **Aprobado**.
- [x] ¿El Desarrollador Backend completó Better Auth, el interceptor de tenant y los permisos mínimos de MySQL? -> **Aprobado (Build & Tests exitosos)**.
- [x] ¿El Desarrollador Frontend implementó las SPAs 100% Web con soporte multi-empresa y protección de roles en Executive Precision Dark? -> **Aprobado (Build exitoso)**.
- [x] ¿El Tester Senior ejecutó la matriz de pruebas multi-tenant y pruebas de penetración sin fallos? -> **Aprobado (3/3 tests unitarios pasados)**.
