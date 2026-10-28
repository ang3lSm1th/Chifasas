# Compact Error Log & Knowledge Memory - Chifa Mariana SaaS

> **Regla de Uso**: Consultar antes de cada tarea. Mantener conciso (estilo directo, cero relleno, mínimo uso de tokens).

---

### [2026-10-19] [Auth & Multi-Tenancy]
- **Error**: Riesgo de fuga de datos si `tenant_id` se recibe desde el payload del cliente.
- **Causa Raíz**: Confianza indebida en parámetros HTTP manipulables.
- **Regla de Prevención**: Extraer SIEMPRE `tenant_id` de la sesión validada en Better Auth vía `AsyncLocalStorage`.

---

### [2026-10-19] [Base de Datos MySQL]
- **Error**: Riesgo de destrucción de esquemas por sincronización automática del ORM.
- **Causa Raíz**: Flags `synchronize: true` o comandos DDL en runtime.
- **Regla de Prevención**: Mantener `synchronize: false` permanente y usuario de MySQL sin permisos `DROP`/`TRUNCATE`.

---

### [2026-10-19] [Frontend & Sesiones]
- **Error**: Cierre de sesión intempestivo de meseras o cocineros durante el servicio en salón/cocina.
- **Causa Raíz**: Expiración estándar de tokens JWT/sesión por tiempo inactivo.
- **Regla de Prevención**: Validar estado de turno: si `status == 'OPEN'`, aplicar keep-alive automático; cerrar sesión solo tras 2-3h post-cierre.

---

### [2026-10-19] [Pantallas KDS & Despacho]
- **Error**: Pérdida de visibilidad de comanda en caja cuando un plato se enruta solo a cocina.
- **Causa Raíz**: Filtrado exclusivo de eventos por estación KDS sin copia a caja.
- **Regla de Prevención**: Enviar SIEMPRE todo pedido completo al terminal de Caja de forma inmutable, en paralelo a las pantallas KDS 1..N.

---

### [2026-10-19] [Infraestructura & Docker Local]
- **Error**: Fallo de conexión al Docker API daemon (`npipe:////./pipe/dockerDesktopLinuxEngine`).
- **Causa Raíz**: Docker Desktop cerrado en la máquina host.
- **Regla de Prevención**: Iniciar Docker Desktop antes de `npm run infra:up` y mantener un mock/fallback seguro en desarrollo para OpenBao.

---

### [2026-10-19] [Arquitectura Cliente 100% Web]
- **Error**: Creación redundante de proyectos móviles nativos (React Native/Expo) innecesarios.
- **Causa Raíz**: Asumir erróneamente app móvil cuando el requerimiento es acceso universal web para celulares.
- **Regla de Prevención**: Todo cliente es 100% Web Responsive en Next.js optimizado para navegación táctil móvil (mínimo 48px por botón).

---

### [2026-10-20] [Ejecución de Servidores y Puertos en Terminal]
- **Error**: Ejecutar servicios de fondo silenciosamente sin terminal visible ni registro de puertos.
- **Causa Raíz**: No mantener procesos demonio interactivos para los puertos de desarrollo.
- **Regla de Prevención**: Levantar servidores esenciales con puertos expuestos (Backend NestJS :4000 y Frontend Next.js :3000) en terminales activas (`IsDaemon: true`) para visibilidad inmediata en panel Terminal y Ports.

---

### [2026-10-25] [Frontend Next.js 16 & Turbopack en Worktrees]
- **Error**: Fallo en `next build` (`Could not find the Next.js package`) al usar Junction/Symlink de `node_modules` hacia otro disco o ruta externa.
- **Causa Raíz**: Turbopack bloquea la resolución de paquetes fuera de `turbopack.root` por aislamiento hermético.
- **Regla de Prevención**: Instalar `frontend/node_modules` localmente dentro del worktree y fijar `turbopack.root: path.resolve(__dirname)` en `next.config.ts`.

---

### [2026-10-25] [Next.js 16 & RTK Query (`Date.now()` Prerender Error)]
- **Error**: `Next.js encountered the unstable value Date.now() in a Client Component` al usar hooks de RTK Query (`useGetCurrentShiftQuery`, etc.).
- **Causa Raíz**: `cacheComponents: true` en `next.config.ts` bloquea llamadas internas a `Date.now()` de Redux Toolkit Query durante el render inicial.
- **Regla de Prevención**: Mantener `cacheComponents: false` y definir `turbopack.root` en `frontend/next.config.ts`.
---

### [2026-10-25] [TenantContextInterceptor en WebSockets & Persistencia Auth]
- **Error**: `TypeError: Cannot read properties of undefined (reading 'x-tenant-id')` en `KdsGateway` y error `Token de autenticación no proporcionado` al recargar `/caja/turno`.
- **Causa Raíz**: `TenantContextInterceptor` asumía contexto HTTP en eventos WS (`context.getType() === 'ws'`); `fetchBaseQuery` carecía de `credentials: 'include'` + hidratación `localStorage`, y `tokenPayload` omitía `id`.
- **Regla de Prevención**: Validar siempre `context.getType() === 'ws'` en interceptores globales, incluir `id` y `sub` en el JWT, y persistir token en `localStorage` + `credentials: 'include'` en RTK Query.
