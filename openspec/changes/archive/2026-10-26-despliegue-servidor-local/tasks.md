# Tasks: Redefinición de Fase 6 a Despliegue en Servidor Local (On-Premise / LAN)

## 1. Actualización del Plan Maestro y Roadmap Constitucional

- [x] 1.1 Actualizar la Fase 6 / Tarea 6 en `Spec/constitution/roadmap.md` reemplazando "Despliegue en Producción Cloud (AWS / VPS)" por "Despliegue en Servidor Local (On-Premise / Red LAN del Restaurante)" y verificar que el diagrama Gantt y el desglose reflejen la operación en red local y respaldos locales.
- [x] 1.2 Actualizar la Fase 6 en `Spec/constitution/plan-ejecucion.md` detallando los entregables de servidor físico local (Docker Compose local con `restart: always`, Reverse Proxy LAN, persistencia de OpenBao, auto-arranque y backups locales de MySQL) y verificar la coherencia del documento.

## 2. Especificación Técnica de la Fase 6 (Tarea 6: Servidor Local)

- [x] 2.1 Crear `Spec/feature/Tarea6/spec.md`, `Spec/feature/Tarea6/plan.md` y `Spec/feature/Tarea6/tasks.md` definiendo la arquitectura de despliegue en el servidor físico del local (IP estática LAN, acceso de celulares por Wi-Fi interno sin depender de internet externo, proxy Nginx local y respaldos automáticos) y verificar que los tres archivos existan y cumplan los estándares de `strict-security`.
- [x] 2.2 Crear la plantilla de orquestación local `infra/docker-compose.prod.yml` y configuración base `infra/nginx/nginx.conf` junto con el script de respaldo local `infra/scripts/backup-local.ps1` (usando `mysqldump --single-transaction` sin comandos destructivos) y verificar su sintaxis con `docker compose -f infra/docker-compose.prod.yml config`.
