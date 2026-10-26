# Design: Despliegue en Servidor Local (On-Premise / LAN)

## Context

El plan original contemplaba en la Fase 6 un despliegue en servidores Cloud (AWS / VPS). Sin embargo, la operación real del restaurante Chifa Mariana se realizará en un **servidor físico local (On-Premise)** ubicado en el propio establecimiento (p. ej., la PC principal de Caja o un mini-servidor dedicado en la red local). Véase `proposal.md` para la motivación completa.

Actualmente `infra/docker-compose.infra.yml` levanta únicamente MySQL 8.0 y OpenBao en modo `-dev` (en memoria). Para producción en servidor local se requiere orquestar toda la pila (Frontend, Backend, MySQL, OpenBao persistente y Reverse Proxy) accesible desde la red Wi-Fi/LAN del restaurante.

## Goals / Non-Goals

**Goals:**
- Actualizar los artefactos maestros (`Spec/constitution/roadmap.md` y `Spec/constitution/plan-ejecucion.md`) para reflejar que la Fase 6 / Tarea 6 corresponde a **Despliegue en Producción en Servidor Local (On-Premise / LAN)**.
- Diseñar la arquitectura de contenedores locales (`infra/docker-compose.prod.yml`) con políticas `restart: always`, volúmenes persistentes y aislamiento de puertos sensibles.
- Garantizar que los teléfonos celulares de las meseras y monitores KDS se conecten vía IP estática LAN (ej. `http://192.168.1.100` o `https://chifa.local`) a través de un Reverse Proxy local (Nginx) que unifique Frontend (`/`) y Backend (`/api/v1`, `/socket.io`).
- Establecer el mecanismo de backup local automatizado de MySQL y persistencia de OpenBao en disco local.

**Non-Goals:**
- Aprovisionamiento en proveedores cloud (AWS EC2, RDS, DigitalOcean, etc.).
- Compra de dominios públicos en internet o certificados Let's Encrypt que dependan de validación DNS pública.

## Decisions

1. **Orquestación con Docker Compose en el Host Local (`infra/docker-compose.prod.yml`)**:
   - *Decisión*: Empaquetar Frontend (Next.js standalone), Backend (NestJS compilado), Nginx (Reverse Proxy), MySQL 8.0 y OpenBao en un único `docker-compose.prod.yml` con `restart: always`.
   - *Racional*: Garantiza que si el servidor local se reinicia, Docker levante todos los servicios en el orden correcto (`depends_on` con `service_healthy`).
   - *Alternativas consideradas*: Ejecutar Node.js con PM2 directamente en Windows/Linux host. Se descarta como opción principal porque Docker aísla versiones de Node, MySQL y Nginx evitando conflictos con actualizaciones del sistema operativo del local.

2. **Proxy Inverso Unificado en Red LAN (Nginx)**:
   - *Decisión*: Exponer un único punto de entrada en la IP LAN del servidor (puerto `80` / `443` con certificado local auto-firmado `mkcert` o HTTP en subred privada) que sirva el Frontend en `/` y redirija `/api/` y `/socket.io/` al Backend (`backend:4000`).
   - *Racional*: Al compartir el mismo origen (`origin`) en la IP LAN, las cookies `HttpOnly` (`SameSite=Lax`/`Strict`) y las conexiones WebSocket funcionan sin bloqueos CORS en navegadores móviles (Chrome en Android y Safari en iOS).
   - *Puertos restringidos*: MySQL (`127.0.0.1:3306:3306`) y OpenBao (`127.0.0.1:8200:8200`) solo escuchan en loopback del servidor local o dentro de la red interna de Docker (`chifa_saas_network`), nunca expuestos al Wi-Fi general.

3. **OpenBao con Almacenamiento Persistente Local**:
   - *Decisión*: En producción local, OpenBao utilizará backend de almacenamiento `file` en un volumen persistente (`openbao_data`) en lugar del flag `-dev` volátil, acompañado de un script de inicialización/unseal local.
   - *Racional*: Evita que los secretos se pierdan al reiniciar el servidor físico del restaurante.

4. **Respaldos Locales Automatizados (`infra/scripts/backup-local.ps1`)**:
   - *Decisión*: Script programado en el programador de tareas del servidor local que ejecuta `mysqldump --single-transaction` hacia una carpeta local sincronizada o unidad USB secundaria con rotación de 30 días.
   - *Racional*: Protege contra fallos de hardware en el disco del servidor local manteniendo la regla *Zero Data Loss*.

## Risks / Trade-offs

- **[Cambio de IP del servidor local por DHCP del router]** → **Mitigación**: Configurar reserva de IP estática (DHCP Binding por MAC) en el router del restaurante o IP fija en el adaptador de red del servidor local (ej. `192.168.1.100`), documentado paso a paso en la guía de Fase 6.
- **[Bloqueo del Firewall de Windows en red LAN]** → **Mitigación**: Incluir script de configuración de regla de entrada en Windows Defender Firewall exclusivamente para el perfil de red Privada en los puertos del Reverse Proxy (`80`/`443`).
- **[Fallo físico del disco del servidor local]** → **Mitigación**: Backups diarios automatizados (`mysqldump`) en ruta secundaria/externa al cierre de cada turno.

## Migration Plan

1. Actualizar inmediatamente `Spec/constitution/roadmap.md` y `Spec/constitution/plan-ejecucion.md` durante la aplicación de este cambio para alinear el plan maestro.
2. En la ejecución de la Fase 6 (tras completar Fase 4 y Fase 5), construir los `Dockerfile` de `backend` y `frontend`, el archivo `infra/docker-compose.prod.yml`, la configuración `infra/nginx/nginx.conf` y los scripts de backup y firewall local.
