# local-server-deployment Specification

## Purpose

Define el comportamiento operativo, de red local (LAN), seguridad, auto-recuperación y respaldo de datos para el despliegue en producción de la plataforma en el servidor físico local del restaurante (On-Premise), sin depender de conexión a internet externa.

## Requirements

### Requirement: Operación Autónoma en Red Local (LAN Offline-First)
El sistema SHALL operar íntegramente dentro de la red privada del restaurante (LAN / Wi-Fi local) desde el servidor físico local, permitiendo el acceso concurrente de la terminal de Caja, las pantallas KDS (1..N) y los navegadores web en los teléfonos celulares de las meseras sin requerir salida a internet.

#### Scenario: Conectividad de dispositivos en red local sin internet externo
- **WHEN** el proveedor de internet (ISP) del restaurante sufre una caída total pero el router Wi-Fi/LAN local y el servidor físico siguen encendidos
- **THEN** las meseras desde sus celulares, las pantallas KDS y el terminal de Caja continúan autenticándose, emitiendo comandas, recibiendo eventos WebSocket en tiempo real y registrando cobros con normalidad a través de la IP LAN del servidor local

#### Scenario: Enrutamiento unificado por Reverse Proxy en IP LAN
- **WHEN** un dispositivo del restaurante accede a la dirección IP estática del servidor local en el puerto estándar (HTTP/HTTPS)
- **THEN** el proxy inverso local enruta las peticiones de interfaz web al servicio Frontend, las llamadas `/api/v1/*` y conexiones `/socket.io/*` al servicio Backend, sin exponer directamente el puerto de MySQL (`3306`) ni el de OpenBao (`8200`) fuera del host local

### Requirement: Persistencia de Secretos, Auto-Arranque y Respaldo Local (Zero Data Loss)
El servidor local SHALL garantizar la persistencia en disco tanto de la base de datos como de la bóveda de secretos, el reinicio automático de todos los servicios tras un corte eléctrico y la generación automatizada de copias de seguridad locales.

#### Scenario: Recuperación automática tras corte de energía eléctrica
- **WHEN** el servidor físico del restaurante se apaga por un corte eléctrico y vuelve a encenderse
- **THEN** el motor de contenedores y todos los servicios del sistema (MySQL, OpenBao, Backend, Frontend y Reverse Proxy) inician automáticamente con políticas `restart: always` y quedan operativos en la red LAN sin intervención técnica manual

#### Scenario: Respaldo local diario e integridad Zero Data Loss
- **WHEN** se ejecuta el proceso programado de respaldo local al cierre de la jornada
- **THEN** el sistema genera un volcado comprimido e íntegro de la base de datos MySQL en el directorio de respaldos locales/externos conservando el historial sin ejecutar jamás sentencias destructivas (`DROP` o `TRUNCATE`)
