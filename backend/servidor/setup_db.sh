#!/usr/bin/env bash
# Configura la base de datos 'ble' de la estación (usuario, base y esquema).
# Pide tu contraseña de sudo para ejecutar psql como el usuario postgres.
# Es idempotente: se puede ejecutar varias veces sin romper nada.
set -euo pipefail

DB_USER="${DB_USER:-ble_user}"
DB_NAME="${DB_NAME:-ble}"
DB_PASS="${DB_PASS:-cambia_esta_clave}"

echo "==> Creando usuario y base de datos (pedirá tu contraseña sudo)…"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

SCHEMA="$(cd "$(dirname "$0")" && pwd)/../db/schema.sql"

ALREADY="$(PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -tAc "SELECT to_regclass('public.clima')")"
if [ "${ALREADY}" = "clima" ]; then
  echo "==> Las tablas ya existen; se conservan los datos actuales."
else
  echo "==> Cargando esquema desde ${SCHEMA}…"
  PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" \
    -v ON_ERROR_STOP=1 -q -f "${SCHEMA}"
fi

echo "✔ Base de datos lista: '${DB_NAME}' (usuario '${DB_USER}')."
echo "  Ahora ejecuta: ./run.sh"
