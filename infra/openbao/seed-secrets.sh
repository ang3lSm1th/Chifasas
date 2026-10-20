#!/usr/bin/env bash
set -e

BAO_ADDR="${OPENBAO_ADDR:-http://localhost:8200}"
BAO_TOKEN="${OPENBAO_TOKEN:-chifa_root_token}"
DB_USER="${DB_USER:-chifa_app}"
DB_PASS="${DB_PASS:-}"
AUTH_SECRET="${AUTH_SECRET:-}"
JWT_KEY="${JWT_KEY:-}"

echo ">>> Conectando a OpenBao en $BAO_ADDR..."

curl -s -X POST \
  -H "X-Vault-Token: $BAO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"host\": \"localhost\",
      \"port\": 3306,
      \"database\": \"chifa_saas\",
      \"user\": \"$DB_USER\",
      \"pass\": \"$DB_PASS\"
    }
  }" \
  "$BAO_ADDR/v1/secret/data/chifa/mysql" || echo "[AVISO] OpenBao no disponible."

curl -s -X POST \
  -H "X-Vault-Token: $BAO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"auth_key\": \"$AUTH_SECRET\",
      \"jwt_key\": \"$JWT_KEY\",
      \"session_name\": \"chifa_session\"
    }
  }" \
  "$BAO_ADDR/v1/secret/data/chifa/better-auth" || echo "[AVISO] OpenBao no disponible."

echo ">>> Inicialización completada."
