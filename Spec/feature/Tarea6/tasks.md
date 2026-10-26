# Desglose de Tareas Técnicas - Tarea 6: Despliegue en Servidor Local (On-Premise / LAN)

## 1. Tareas del Orquestador Senior (Arquitectura & Seguridad Local)
- [ ] **ORQ-01**: Validar que `infra/docker-compose.prod.yml` restrinja los puertos de MySQL (`127.0.0.1:3306:3306`) y OpenBao (`127.0.0.1:8200:8200`) al loopback del servidor físico, exponiendo solo Nginx en la red LAN.
- [ ] **ORQ-02**: Verificar que el script de respaldo local cumpla estrictamente la política *Zero Data Loss* sin sentencias destructivas en producción.

---

## 2. Tareas de Infraestructura y DevOps Local
- [ ] **INF-01**: Crear `infra/docker-compose.prod.yml` con políticas `restart: always` y `healthcheck` para `mysql`, `openbao`, `backend`, `frontend` y `nginx`.
- [ ] **INF-02**: Configurar `infra/nginx/nginx.conf` con soporte para Reverse Proxy de Next.js, API REST (`/api/v1`) y túneles WebSocket (`/socket.io/`) en la IP LAN del servidor local.
- [ ] **INF-03**: Crear `infra/scripts/backup-local.ps1` para respaldos diarios automatizados de la base de datos MySQL en almacenamiento local/externo.

---

## 3. Tareas del Tester / QA Senior (Operación en Red Local)
- [ ] **QA-01 (Prueba de Operación LAN Offline)**: Verificar que Caja, KDS y celulares de meseras operen mediante la IP LAN del servidor local sin necesidad de conexión a internet externa.
- [ ] **QA-02 (Prueba de Auto-Recuperación)**: Verificar que tras reiniciar el motor Docker/servidor local todos los contenedores vuelvan a estado `healthy`.
- [ ] **QA-03 (Prueba de Respaldo Local)**: Ejecutar `infra/scripts/backup-local.ps1` y comprobar la generación íntegra del archivo `.sql`.
