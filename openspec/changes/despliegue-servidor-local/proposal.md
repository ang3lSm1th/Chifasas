# Proposal: Redefinición de Fase 6 a Despliegue en Servidor Local (On-Premise / LAN)

## Why

El restaurante operará la plataforma desde un servidor físico local dentro del establecimiento (conectado a la red LAN / Wi-Fi privada para Caja, Pantallas KDS y celulares de meseras) en lugar de un servidor Cloud (AWS/VPS). Cambiar la Fase 6 a un despliegue en servidor local elimina costos recurrentes de nube, garantiza latencia ultra-baja (<5ms) en comandas y WebSockets, y asegura continuidad operativa del salón y cocina incluso ante cortes del proveedor de internet (ISP).

## What Changes

- **BREAKING (Roadmap & Plan de Ejecución - Fase 6)**: Se reemplaza el alcance de la Fase 6 ("Despliegue en Producción Cloud AWS/VPS") en `Spec/constitution/roadmap.md` y `Spec/constitution/plan-ejecucion.md` por **"Despliegue en Producción en Servidor Local (On-Premise / Red LAN)"**.
- **Orquestación de Producción Local (`infra/docker-compose.prod.yml`)**: Configuración unificada para ejecutar MySQL 8.0 (con PoLP y persistencia en disco local), OpenBao (con almacenamiento persistente en archivo en lugar de `-dev`), Backend NestJS, Frontend Next.js (build de producción) y Reverse Proxy local (Nginx/Caddy).
- **Red Local (LAN) y Acceso Móvil**: Exposición en la IP estática LAN del servidor local (o dominio mDNS/hosts local) para que los celulares de las meseras, tablets/monitores KDS y la PC de Caja se conecten por Wi-Fi/Ethernet local con soporte para cookies seguras y WebSockets.
- **Auto-arranque y Respaldo Local Automatizado**: Scripts de inicio automático ante reinicios eléctricos del servidor del local y tarea programada de backup diario de la base de datos MySQL en almacenamiento local/externo (cumpliendo la regla Zero Data Loss).

## Capabilities

### New Capabilities
- `local-server-deployment`: Aprovisionamiento, orquestación en contenedores, exposición en red LAN para dispositivos del restaurante, auto-arranque y respaldos locales automatizados en el servidor físico del local.

### Modified Capabilities
<!-- Ninguna capacidad existente cambia sus requisitos funcionales a nivel de spec. -->

## Impact

- **Documentación de Arquitectura y Planificación**: `Spec/constitution/roadmap.md` y `Spec/constitution/plan-ejecucion.md` (actualización de Fase 6 / Tarea 6).
- **Infraestructura (`infra/`)**: Nuevo archivo `infra/docker-compose.prod.yml`, configuración de proxy inverso local (`infra/nginx/`), configuración persistente de OpenBao y scripts de administración local (`infra/scripts/backup-local.ps1`, `infra/scripts/start-local-server.ps1`).
- **Configuración CORS / Red (`backend/` y `frontend/`)**: Variables de entorno de producción orientadas a la IP LAN del servidor local.
