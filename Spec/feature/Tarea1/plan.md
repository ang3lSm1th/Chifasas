# Plan de Implementación Técnica - Tarea 1: Fundaciones SaaS Multi-Tenancy, Better Auth y Gestión de Personal

## 1. Arquitectura del Monolito Modular Multi-Tenant (NestJS)

```
src/
├── core/
│   ├── openbao/                      # Cliente OpenBao para bootstrap de secretos
│   │   ├── openbao.service.ts
│   │   └── openbao.module.ts
│   ├── database/                     # MySQL con Aislamiento Multi-Tenant
│   │   ├── tenant-context.service.ts # AsyncLocalStorage para tenant_id
│   │   ├── tenant-aware.repository.ts
│   │   └── data-source.ts            # TypeORM con synchronize: false
│   ├── security/                     # Protocolo de Seguridad Estricta
│   │   ├── throttler-tenant.guard.ts
│   │   ├── timing-safe.interceptor.ts
│   │   └── helmet.config.ts
│   └── better-auth/                  # Integración Better Auth Framework
│       ├── better-auth.config.ts
│       ├── better-auth.module.ts
│       └── guards/
│           ├── auth.guard.ts
│           └── roles.guard.ts
├── common/
│   ├── interceptors/
│   │   └── tenant-context.interceptor.ts
│   └── filters/
│       └── global-exception.filter.ts
└── modules/
    ├── tenants/                      # Módulo de Empresas / Inquilinos
    │   ├── tenants.controller.ts
    │   ├── tenants.service.ts
    │   └── entities/tenant.entity.ts # Con @DeleteDateColumn()
    └── users/                        # Trabajadores por Tenant
        ├── users.controller.ts
        ├── users.service.ts
        ├── entities/user.entity.ts   # Con @DeleteDateColumn() y tenant_id
        └── dto/
            ├── create-user.dto.ts
            └── update-user.dto.ts
```

---

## 2. Integración con Better Auth y Organizaciones Multi-Tenant

### 2.1. Configuración de Better Auth
- Se inicializa Better Auth conectado a la instancia MySQL con credenciales suministradas en memoria por OpenBao.
- Se activa el plugin `organization` de Better Auth para modelar cada empresa inquilina.
- Control de roles (`ADMIN`, `CAJERO`, `MESERA`, `COCINERO`) por organización.

### 2.2. Aislamiento con `TenantContextInterceptor`
- Mediante `AsyncLocalStorage` de Node.js, cada petición HTTP captura el `tenantId` verificado y lo provee de manera transparente a los repositorios de TypeORM:
  ```typescript
  // Todas las queries filtran automáticamente por tenant_id
  queryBuilder.andWhere('entity.tenant_id = :tenantId', { tenantId: currentTenantId });
  ```

---

## 3. Seguridad de Persistencia en MySQL y Secretos OpenBao

### 3.1. Usuario de Base de Datos Restringido
```sql
CREATE USER 'chifa_app'@'%' IDENTIFIED BY '<secret_from_openbao>';
GRANT SELECT, INSERT, UPDATE, EXECUTE ON chifa_saas.* TO 'chifa_app'@'%';
-- CERO PRIVILEGIOS DROP, TRUNCATE, ALTER
FLUSH PRIVILEGES;
```

### 3.2. Carga en Memoria con OpenBao & Auditoría con Gitleaks
- En `main.ts`, el servicio `OpenBaoVaultService` obtiene los secretos antes de inicializar los módulos de TypeORM y Better Auth. Sin `.env` planos.
- Husky ejecuta `npx gitleaks protect --staged` en pre-commit para anular cualquier commit con secretos.

---

## 4. Frontend Descentralizado (Next.js SPA con RTK & Executive Precision Dark)

### 4.1. Design System & Tokens
- Canvas `#0B0F17`, Cards `#131823`, Bordes `#20293A`.
- Acciones Primary `#2563EB`, Secondary `#10B981`, Warning `#D97706`.
- Tipografías: Headline/Body `Inter`, Métricas/Datos `JetBrains Mono`.
- Animaciones Emil Kowalski: curva spring `cubic-bezier(0.16, 1, 0.3, 1)`, active state `scale(0.97)` en botones táctiles.

### 4.2. Redux Toolkit (RTK) Store
- `authSlice`: Estado de sesión Better Auth, token activo y datos del usuario/tenant.
- `RTK Query`: Endpoint `useGetWorkersQuery` y `useCreateWorkerMutation` con invalidación de tags para renderizado reactivo instantáneo.

### 4.3. Rutas y Componentes
- `/login`: Formulario táctil en `Executive Precision Dark` con manejo de rate limit (429) y temporizador visual.
- `/admin/trabajadores`: Vista protegida por middleware para rol `ADMIN`. Tabla reactiva con modal táctil para registro de trabajadores.

---

## 5. Loop de Rectificación para Tarea 1
1. **Orquestador Senior**: Revisa el modelo multi-tenant y la inyección de OpenBao.
2. **Desarrollador Backend**: Comprueba Better Auth, el interceptor de contexto de tenant y los soft-deletes.
3. **Desarrollador Frontend**: Valida la UI en `Executive Precision Dark` con RTK y feedback táctil de Emil Kowalski.
4. **Tester Senior**: Ejecuta pruebas de penetración y verifica que ningún tenant acceda a datos de otro.
5. **Memoria de Errores**: Registrar cualquier lección o desvío en `Spec/memory/error-log.md` de forma compacta.
