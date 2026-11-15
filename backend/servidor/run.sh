#!/usr/bin/env bash
# Levanta el servidor Flask de la estación usando el entorno virtual local.
# Crea el venv automáticamente la primera vez (evita el error
# "externally-managed-environment" de pip en Ubuntu 24.04 / Python 3.12).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
VENV="$HERE/.venv"

if [ ! -x "$VENV/bin/python" ]; then
  echo "==> Creando entorno virtual e instalando dependencias…"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -r "$HERE/requirements.txt"
fi

echo "==> Servidor Flask en http://localhost:5000 (Ctrl+C para salir)"
exec "$VENV/bin/python" "$HERE/servidor_ble_postgres.py"
