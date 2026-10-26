# Especificación Funcional y de Seguridad - Tarea 6: Despliegue en Servidor Local (On-Premise / LAN)

## 1. Propósito
Establecer la arquitectura y reglas operativas para desplegar la plataforma Chifa Mariana en un **servidor físico local dentro del restaurante (On-Premise)** conectado a la red privada LAN / Wi-Fi del local, permitiendo operación autónoma, latencia inferior a 5ms y continuidad del negocio sin depender de internet externo (ISP).

---

## 2. Reglas de Operación en Servidor Local y Red LAN

### 2.1. Acceso Unificado en Red Privada (LAN Offline-First)
- **Servidor Físico Local**: El sistema reside en el equipo servidor principal del restaurante (con IP LAN estática, ej. `192.168.1.100`).
- **Dispositivos Conectados en LAN**:
  - **Terminal de Caja / Admin**: Acceso vía navegador en el propio servidor (`localhost`) o PC en red LAN.
  - **Pantallas KDS (1..N)**: Monitores o tablets conectados por cable Ethernet o Wi-Fi local a `http://<IP_SERVIDOR_LOCAL>/kds/[stationId]`.
  - **Celulares de Meseras (100% Web)**: Smartphones Android e iOS conectados al Wi-Fi interno del local accediendo a `http://<IP_SERVIDOR_LOCAL>/comandero`.
- **Independencia de Internet (ISP)**: Si se corta el servicio de internet externo, el router local mantiene la red LAN/Wi-Fi activa y el sistema opera al 100% (autenticación, turnos, comandas, WebSockets y caja).

### 2.2. Seguridad Estricta en el Servidor Local (`strict-security`)
- **Aislamiento de Puertos Internos**:
  - `MySQL (3306)` y `OpenBao (8200)` **jamás** se exponen a la red Wi-Fi general (`0.0.0.0`); únicamente escuchan dentro de la red interna de contenedores (`chifa_saas_network`) o en `127.0.0.1` del servidor físico.
  - Solo el Reverse Proxy local (`Nginx` en puerto `80`/`443`) se expone a la subred LAN privada del restaurante.
- **Persistencia de Secretos en OpenBao**:
  - En producción local, OpenBao utiliza almacenamiento en disco cifrado (`file` storage backend) en lugar del modo `-dev` en memoria.
- **Protección de Base de Datos (Zero Data Loss)**:
  - Usuario de aplicación `chifa_app` restringido a `SELECT`, `INSERT`, `UPDATE`, `EXECUTE` (sin permisos `DROP` ni `TRUNCATE`).
  - Respaldo automático diario (`mysqldump --single-transaction`) almacenado en unidad local/externa con retención mínima de 30 días.

### 2.3. Auto-Arranque y Recuperación ante Cortes Eléctricos
- Todos los contenedores (`mysql`, `openbao`, `backend`, `frontend`, `nginx`) cuentan con política `restart: always` y chequeos de salud (`healthcheck`).
- Al encender el servidor físico tras un corte eléctrico, el servicio de contenedores inicia automáticamente y restablece toda la plataforma sin intervención manual.
