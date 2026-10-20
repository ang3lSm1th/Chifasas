---
name: strict-security
description: Directrices estrictas de ciberseguridad perimetral, interna y de base de datos (Strict Security) para SaaS Multi-Tenancy, Better Auth, OpenBao, Gitleaks, sanitización y prevención de ataques.
---

# Strict Security Protocol - SaaS Gastronómico

## 1. Principios Mandatorios de Seguridad Estricta
1. **Zero-Trust Multi-Inquilino**:
   - Todo servicio, repositorio y socket debe verificar y validar explícitamente el `tenant_id` autenticado.
   - Prohibido el paso de `tenantId` como parámetro manipulable por el cliente; siempre se extrae de la sesión verificada en Better Auth.
2. **Defensa en Profundidad del Login**:
   - Throttling a nivel de IP y usuario (máximo 5 intentos por ventana de 5 minutos).
   - Bloqueo temporal exponencial con respuesta `429 Too Many Requests`.
   - Comparación en tiempo constante y mensaje unificado genérico (`"Credenciales incorrectas"`) para anular *timing attacks* y enumeración de usuarios.
3. **Regla de Inmutabilidad de Persistencia (Anti-Eliminación)**:
   - Permisos de la conexión MySQL limitados estrictamente a `SELECT`, `INSERT`, `UPDATE`, `EXECUTE`.
   - Prohibición terminante de permisos DDL (`DROP`, `TRUNCATE`, `ALTER`).
   - Implementación obligatoria de *Soft-Deletes* con `deleted_at`.
4. **Protección Perimetral de Secretos**:
   - Cero credenciales en `.env` planos de producción. Todo secreto se inyecta en memoria vía **OpenBao**.
   - Escaneo obligatorio con **Gitleaks** en pre-commit hooks (Husky) y CI/CD.
5. **Cabeceras HTTP y Sanitización (Helmet & CSP)**:
   - `Content-Security-Policy`: Solo orígenes aprobados, sin `unsafe-inline` o `unsafe-eval` innecesario.
   - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
