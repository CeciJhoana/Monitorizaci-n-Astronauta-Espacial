# Estado: migrar el servidor a la Raspberry Pi

**Fecha:** 2026-11-15
**Objetivo:** mover el servidor Flask + PostgreSQL de la laptop a la Raspberry Pi,
para que la Pi sea el servidor del proyecto (el ESP32 "esp32_astro" le mandará los datos).

## Dónde vamos (punto exacto)

Estamos **bloqueados en el ACCESO a la Pi**. Todo lo demás (servidor, base, ESP32) ya funciona en la laptop.

### Lo que ya se averiguó
- La Pi está en la **WiFi `ZTE_2.4Ghost-EXT`**, con IP **`192.168.11.242`** (MAC `28:66:e3:...` = AzureWave, WiFi USB; TTL 64 = Linux). Casi seguro es la Pi.
- El **cable Ethernet laptop↔Pi NO sirve** (`enp5s0` sin enlace, carrier 0). Se ignora, la Pi va por WiFi.
- **SSH está apagado** en la Pi: el puerto 22 da "Connection refused". No hay forma de entrar por red todavía.
- No sabemos el **usuario** de la Pi ni la contraseña.
- La laptop **no tiene lector de microSD** (usaría adaptador USB).

### Plan acordado para desbloquear (OPCIÓN A: monitor+teclado)
El usuario va a conectar la Pi a la **TELE por HDMI** + un **teclado USB**.

**SIGUIENTE PASO cuando se retome:**
1. Conectar Pi a la tele (HDMI0 si es Pi4/5) + teclado USB + corriente. Elegir la entrada HDMI correcta en la tele.
2. Ver qué aparece: escritorio / login de texto (`raspberrypi login:`) / nada.
3. Según eso:
   - Abrir una terminal en la Pi.
   - `whoami`         → saber el usuario
   - `hostname -I`    → saber su IP real
   - `sudo raspi-config` → Interface Options → SSH → Enable
     (o `sudo systemctl enable --now ssh`)
4. Con SSH activo + usuario + contraseña, desde la LAPTOP:
   `ssh USUARIO@192.168.11.242`

### Resto de la migración (lo hace Claude por SSH, ya con acceso)
1. En la Pi: `sudo apt update && sudo apt install -y postgresql python3-flask python3-psycopg2`
2. Crear DB `ble` + usuario `ble_user` (misma contraseña `cambia_esta_clave`) y la tabla.
3. Copiar `/home/deyni/servidor_ble_postgres.py` a la Pi (scp).
4. Migrar las **659 filas** actuales:
   `pg_dump` de la tabla `clima` en la laptop → restaurar en la Pi (o `\copy` a CSV).
5. Crear servicio systemd en la Pi (equivalente a `ble.service`) para que arranque solo.
6. En el sketch `estacion_vitales.ino`: cambiar `SERVIDOR` a la IP de la Pi
   (`192.168.11.242:5000`) y reflashear el ESP32.
7. Verificar: el ESP32 postea a la Pi y `http://192.168.11.242:5000/clima/ver` muestra datos.

## Datos clave (recordatorio)
- Servidor actual (laptop): `/home/deyni/servidor_ble_postgres.py`, systemd `ble.service`.
- DB: `PGPASSWORD=cambia_esta_clave psql -h localhost -U ble_user -d ble` (tabla `clima`).
- Sketch: `/home/deyni/Descargas/SignosVitales/estacion_vitales/estacion_vitales.ino`
  (IP del servidor en `#define SERVIDOR ...`). FQBN `esp32:esp32:esp32:FlashMode=dio,FlashFreq=40`, puerto `/dev/ttyUSB0`.
- Herramienta: `/home/deyni/Descargas/SignosVitales/signos.sh`.

## Cómo retomar la sesión de Claude Code
- `claude --resume`  → lista las sesiones guardadas, eliges esta.
- `claude -c`        → continúa la más reciente directamente.
Luego dile: "seguimos migrando el servidor a la Raspberry, lee ESTADO_MIGRACION_RASP.md".
