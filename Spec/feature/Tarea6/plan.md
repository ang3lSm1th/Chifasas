# Plan Técnico - Tarea 6: Despliegue en Servidor Local (On-Premise / LAN)

## 1. Arquitectura de Despliegue Local

```mermaid
graph LR
    subgraph Red_WiFi_LAN_Restaurante [Red LAN / Wi-Fi Privada del Local - 192.168.1.x]
        CEL[Celulares Meseras\nNavegador Web]
        KDS[Monitores / Tablets\nPantallas KDS 1..N]
        CAJA[Terminal de Caja / Admin\nNavegador Web]
    end

    subgraph Servidor_Fisico_Local [Servidor Local del Restaurante - Docker Compose Prod]
        NGINX[Nginx Reverse Proxy\nPuerto 80 / 443 LAN]
        NEXT[Frontend Next.js\nPuerto Interno 3000]
        NEST[Backend NestJS + WebSockets\nPuerto Interno 4000]
        BAO[(OpenBao Vault\nVolumen Persistente)]
        DB[(MySQL 8.0 InnoDB\nUsuario PoLP chifa_app)]
        BACKUP[Script Backup Diario\nmysqldump -> Disco/USB]
    end

    CEL -->|HTTP / WS LAN| NGINX
    KDS -->|HTTP / WS LAN| NGINX
    CAJA -->|HTTP / WS LAN| NGINX

    NGINX -->|/| NEXT
    NGINX -->|/api/v1 & /socket.io| NEST
    NEST --> BAO
    NEST --> DB
    DB -.->|Volcado No Destructivo| BACKUP
```

---

## 2. Componentes a Implementar

1. **Orquestación de Producción Local (`infra/docker-compose.prod.yml`)**:
   - Servicios: `mysql`, `openbao`, `backend`, `frontend`, `nginx`.
   - Red privada interna `chifa_saas_network`.
   - Puertos de MySQL y OpenBao ligados exclusivamente a `127.0.0.1`.
2. **Reverse Proxy Local (`infra/nginx/nginx.conf`)**:
   - Enrutamiento de `/` hacia `frontend:3000`.
   - Enrutamiento de `/api/` y `/socket.io/` (con cabeceras `Upgrade` y `Connection "upgrade"` para WebSockets en tiempo real) hacia `backend:4000`.
3. **Respaldo Local Automatizado (`infra/scripts/backup-local.ps1`)**:
   - Ejecución de `mysqldump --single-transaction --routines --triggers` desde el contenedor `chifa_saas_mysql`.
   - Compresión con fecha/hora y limpieza de respaldos mayores a 30 días.
