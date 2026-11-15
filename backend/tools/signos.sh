#!/usr/bin/env bash
# =============================================================
#  signos.sh - Utilidad para la estacion de signos vitales ESP32
#  Proyecto SignosVitales (UMSS) - servidor Flask + PostgreSQL
# =============================================================

# ---- Configuracion (ajusta si cambia algo) ----
PGPASSWORD_VAL="cambia_esta_clave"
DB_USER="ble_user"
DB_NAME="ble"
DB_HOST="localhost"
PUERTO_SERVER="5000"
SKETCH_DIR="$HOME/Descargas/SignosVitales/estacion_vitales"
FQBN="esp32:esp32:esp32:FlashMode=dio,FlashFreq=40"
PUERTO_ESP="/dev/ttyUSB0"
ARDUINO_CLI="$HOME/.local/bin/arduino-cli"
SERVICIO="ble.service"
# ------------------------------------------------

export PGPASSWORD="$PGPASSWORD_VAL"
PSQL="psql -h $DB_HOST -U $DB_USER -d $DB_NAME"

# Colores
V='\033[0;32m'; A='\033[1;33m'; R='\033[0;31m'; N='\033[0m'

ip_local() { hostname -I | awk '{print $1}'; }

menu() {
  echo -e "${V}== signos.sh - comandos de la estacion ==${N}"
  echo "  IP actual de la compu:  $(ip_local)"
  echo
  echo "  DATOS:"
  echo "    ver       Ultimas lecturas (JSON del servidor)"
  echo "    db        Ultimas 10 lecturas (base de datos)"
  echo "    total     Cuantas lecturas hay y la mas reciente"
  echo "    watch     EN VIVO: refresca cada 2s (Ctrl+C para salir)"
  echo
  echo "  SERVIDOR:"
  echo "    status    Ver si el servidor corre"
  echo "    logs      Logs del servidor en vivo (cada POST)"
  echo "    restart   Reiniciar el servidor (tras editar el .py)"
  echo
  echo "  ESP32:"
  echo "    monitor   Monitor serie (cierra antes el Arduino IDE)"
  echo "    subir     Compilar y subir el sketch al ESP32"
  echo
  echo "  RED:"
  echo "    ip        IP de la compu y WiFi conectada"
  echo
  echo "  Uso:  ./signos.sh <comando>"
}

case "$1" in
  ver)
    curl -s "http://localhost:$PUERTO_SERVER/clima" | python3 -m json.tool
    ;;
  db)
    $PSQL -c "SELECT fecha, temperatura, humedad, detector FROM clima ORDER BY id DESC LIMIT 10;"
    ;;
  total)
    $PSQL -c "SELECT count(*) AS total, max(fecha) AS ultima FROM clima;"
    ;;
  watch)
    watch -n2 "PGPASSWORD=$PGPASSWORD_VAL $PSQL -c \"SELECT fecha, temperatura, humedad FROM clima ORDER BY id DESC LIMIT 5;\""
    ;;
  status)
    systemctl status "$SERVICIO" --no-pager
    ;;
  logs)
    echo -e "${A}Logs en vivo (Ctrl+C para salir)...${N}"
    journalctl -u "$SERVICIO" -f
    ;;
  restart)
    echo -e "${A}Reiniciando $SERVICIO ...${N}"
    sudo systemctl restart "$SERVICIO" && echo -e "${V}OK${N}"
    ;;
  monitor)
    if fuser "$PUERTO_ESP" >/dev/null 2>&1; then
      echo -e "${R}El puerto $PUERTO_ESP esta ocupado (cierra el Monitor Serie del Arduino IDE).${N}"
      exit 1
    fi
    "$ARDUINO_CLI" monitor -p "$PUERTO_ESP" -c baudrate=115200
    ;;
  subir|build)
    if fuser "$PUERTO_ESP" >/dev/null 2>&1; then
      echo -e "${R}Puerto ocupado: cierra el Monitor Serie del Arduino IDE antes de subir.${N}"
      exit 1
    fi
    echo -e "${A}Compilando...${N}"
    "$ARDUINO_CLI" compile --fqbn "$FQBN" "$SKETCH_DIR" || exit 1
    echo -e "${A}Subiendo a $PUERTO_ESP ...${N}"
    "$ARDUINO_CLI" upload -p "$PUERTO_ESP" --fqbn "$FQBN" "$SKETCH_DIR" && echo -e "${V}Subido OK${N}"
    ;;
  ip)
    echo "IP compu : $(ip_local)"
    echo -n "WiFi     : "; iw dev wlp4s0 link 2>/dev/null | awk -F': ' '/SSID/{print $2}'
    ;;
  ""|help|-h|--help)
    menu
    ;;
  *)
    echo -e "${R}Comando desconocido: $1${N}"
    echo
    menu
    exit 1
    ;;
esac
