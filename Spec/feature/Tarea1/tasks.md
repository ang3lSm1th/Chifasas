# Desglose de Tareas Técnicas - Tarea 1: Fundaciones SaaS Multi-Tenancy, Better Auth y Gestión de Personal

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [ ] **ORQ-01**: Validar el modelo de datos multi-inquilino en MySQL asegurando aislamiento estricto por `tenant_id` y llaves foráneas.
- [ ] **ORQ-02**: Diseñar la especificación de secretos en **OpenBao** (paths de credenciales de BD y llaves de Better Auth) garantizando que no existan `.env` planos.
- [ ] **ORQ-03**: Verificar el script de MySQL para el usuario `chifa_app` garantizando el Principio de Menor Privilegio (PoLP sin `DROP` ni `TRUNCATE`).
- [ ] **ORQ-04**: Configurar la política de **Gitleaks** en pre-commit con Husky y pipeline de CI/CD.
- [ ] **ORQ-05**: Supervisar el **Loop de Rectificación**: Revisar reporte de seguridad del Tester y emitir aprobación formal.

---

## 2. Tareas del Desarrollador Backend (NestJS & Better Auth)
- [ ] **BE-01**: Configurar proyecto NestJS bajo arquitectura de Monolito Modular con soporte Multi-Tenant.
- [ ] **BE-02**: Implementar `OpenBaoModule` para inyección de secretos en memoria durante el bootstrap.
- [ ] **BE-03**: Configurar conexión a MySQL con TypeORM:
  - `synchronize: false` permanente.
  - Migración inicial con tablas `tenants`, `roles`, `users` y `login_attempts`.
  - Integración transversal de soft-deletes con `@DeleteDateColumn()`.
- [ ] **BE-04**: Integrar **Better Auth** con plugin de organizaciones:
  - Configuración de sesiones seguras por base de datos/tokens.
  - Protecciones perimetrales anti-fuerza bruta con `@nestjs/throttler` (límite de 5 intentos por 5 minutos).
  - Mitigación de timing attacks y mensajes genéricos unificados.
- [ ] **BE-05**: Implementar `TenantContextInterceptor` con `AsyncLocalStorage` para inyectar automáticamente el filtro `tenant_id` en todas las consultas.
- [ ] **BE-06**: Implementar `UsersModule`:
  - CRUD de trabajadores protegido por `RolesGuard(['ADMIN'])`.
  - Vinculación automática al `tenant_id` del usuario en sesión.

---

## 3. Tareas del Desarrollador Frontend (Next.js SPA)
- [ ] **FE-01**: Configurar SPA base en Next.js con soporte multi-tenant (detección de slug de tenant o selección de empresa).
- [ ] **FE-02**: Implementar SPA de Login con Better Auth Client:
  - Manejo de respuestas 429 con contador visual de bloqueo.
  - Soporte táctil optimizado para terminales de salón y caja.
- [ ] **FE-03**: Implementar SPA de Gestión de Trabajadores (`/admin/trabajadores`):
  - Vista restringida a usuarios con rol `ADMIN`.
  - Listado reactivo de personal y modal para registrar nuevos empleados.

---

## 4. Tareas del Tester / QA Senior (Seguridad & Multi-Tenancy)
- [ ] **QA-01 (Prueba de Aislamiento Multi-Tenant)**:
  - Crear registros en Tenant 1 y Tenant 2.
  - Verificar que las peticiones con credenciales del Tenant 1 no puedan visualizar ni alterar registros del Tenant 2 (fuga de datos = 0).
- [ ] **QA-02 (Prueba de Fuerza Bruta en Login)**:
  - Ejecutar 6 intentos erróneos consecutivos; validar retorno estricto de `429 Too Many Requests` y bloqueo temporal.
- [ ] **QA-03 (Prueba de Integridad de BD y Anti-Eliminación)**:
  - Intentar ejecutar `DROP TABLE users;` o `TRUNCATE TABLE tenants;` con la conexión de la app.
  - Validar que MySQL rechace la operación por falta de privilegios DDL.
  - Validar que al eliminar un usuario se marque `deleted_at` sin destruirlo físicamente.
- [ ] **QA-04 (Prueba de Acceso Exclusivo de ADMIN a Personal)**:
  - Intentar invocar `/api/v1/users` con tokens de `MESERA`, `CAJERO` o `COCINERO`.
  - Validar respuesta `403 Forbidden`.
- [ ] **QA-05 (Prueba de Detección de Secretos con Gitleaks)**:
  - Simular commit con clave privada y confirmar que el hook de Husky aborte la operación.

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [ ] ¿El Orquestador Senior aprobó el aislamiento multi-tenant y la integración con OpenBao?
- [ ] ¿El Desarrollador Backend completó Better Auth, el interceptor de tenant y los permisos mínimos de MySQL?
- [ ] ¿El Desarrollador Frontend implementó las SPAs con soporte multi-empresa y protección de roles?
- [ ] ¿El Tester Senior ejecutó la matriz de pruebas multi-tenant y pruebas de penetración sin fallos?
