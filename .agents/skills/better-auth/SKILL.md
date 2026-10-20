---
name: better-auth
description: Directrices, mejores prácticas y patrones de implementación para Better Auth en arquitecturas TypeScript, NestJS y Next.js con soporte Multi-Tenancy (Organizaciones), gestión de sesiones por base de datos, hooks de expiración condicional y autenticación segura.
---

# Better Auth Skill - Multi-Tenancy & Sesiones Resilientes

## 1. Visión General
**Better Auth** es un marco de autenticación integral y modular para TypeScript y Node.js/Next.js/NestJS. Provee autenticación nativa por usuario/contraseña, sesiones seguras basadas en base de datos o tokens criptográficos, plugin de organizaciones (Multi-Tenancy) y soporte avanzado de control de acceso basado en roles (RBAC).

---

## 2. Configuración para SaaS Multi-Tenancy
Para entornos SaaS donde múltiples restaurantes conviven en una base de datos compartida:

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    provider: "mysql",
    // Configuración inyectada dinámicamente desde OpenBao
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // Base de 7 días, pero gestionada por ciclo de turno
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    organization({
      // Cada Tenant / Restaurante es una organización
      allowUserToCreateOrganization: false, // Solo SUPER_ADMIN o invitación
      roles: {
        admin: ["tenant:manage", "users:create", "shifts:manage", "catalog:manage", "kds:manage"],
        cajero: ["shifts:manage", "orders:charge", "cash:manage"],
        mesera: ["orders:create", "tables:view", "catalog:view"],
        cocinero: ["kds:view", "kds:update"],
      },
    }),
  ],
});
```

---

## 3. Regla de Sesión Persistente Atada al Turno (Shift-Bound Session Lifetime)
En operaciones de gastronomía / POS, las sesiones **no deben caducar** mientras el turno del restaurante continúe en estado `OPEN`.

### Mecanismo de Control:
1. **Hook de Validación de Sesión (`beforeSessionCheck` / Middleware)**:
   - Al recibir cada petición, se verifica el `tenant_id` y el estado del turno activo (`shift_status`).
   - Si `shift_status === 'OPEN'`, la sesión se renueva automáticamente sin requerir interacción del usuario.
2. **Expiración Post-Cierre (2 a 3 horas)**:
   - Cuando el Administrador o Cajero ejecuta el cierre de turno (`closed_at`), se establece una marca de expiración definitiva: `grace_period_expires_at = closed_at + 2.5 hours`.
   - Transcurrida la ventana de gracia de 2 a 3 horas post-cierre de caja, cualquier intento de petición invalida la sesión de todo el personal (meseras, cocineros, cajeros) retornando HTTP `401 Unauthorized` y forzando un nuevo login cuando se inicie la siguiente jornada.
