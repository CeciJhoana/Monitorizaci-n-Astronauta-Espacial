# Estación de Signos Vitales de Astronauta — ESP32 + Flask + PostgreSQL

Prototipo (prueba de concepto) para **monitorear signos vitales + ambiente + radiación**
de un astronauta. Un **ESP32** lee sensores, muestra un resumen en una pantalla OLED con
avatar, y envía todo por **WiFi** a un **servidor Flask** que lo guarda en **PostgreSQL**
y lo publica en una página web que se refresca sola.

> Proyecto para la sociedad científica de la **UMSS (Universidad Mayor de San Simón)**.
> **No es un dispositivo médico**, es una demostración.

---

## 🛰️ Qué hace

- **Ambiente (real):** temperatura y humedad con sensor **AHT10/AHT20** (I2C).
- **Radiación UV (real):** sensor **CJMCU / ML8511** (analógico, GPIO34).
- **Signos vitales:** pulso, SpO₂ y temperatura corporal.
  - En la demo se **simulan** con caminata aleatoria dentro de rangos médicos.
  - Para pasarlos a real: sensor **MAX30102** (pulso+SpO₂, I2C) — ver *Pendientes*.
- **Salud (%):** el firmware calcula un puntaje penalizando parámetros fuera de rango
  y da una **recomendación** contextual del peor parámetro.
- **OLED (SH1106):** rota 4 pantallas — Avatar+Salud, Vitales, Ambiente/Radiación,
  Recomendación. La cara del astronauta cambia (feliz / serio / triste).
- **Alerta:** LED RGB (verde/amarillo/rojo) + zumbador según la salud.
- **Servidor:** guarda cada envío y muestra la tabla en `/clima/ver`.

---

## 🧭 Arquitectura

```
┌───────────────────────┐        ┌──────────────────┐        ┌──────────────┐
│        ESP32          │  WiFi  │   Flask  :5000   │        │  PostgreSQL  │
│  AHT · UV · OLED ·     │ ─POST─▶│ servidor_ble_    │ ─────▶ │   base 'ble' │
│  LED RGB · zumbador    │ (JSON) │ postgres.py      │        │ tabla 'clima'│
│  (+ MAX30102 futuro)   │        │  página /clima/ver        │              │
└───────────────────────┘        └──────────────────┘        └──────────────┘
```

---

## 📁 Estructura del repo

```
estacion-signos-vitales/
├── firmware/                     # Código del ESP32 (Arduino / .ino)
│   ├── estacion_vitales/         # ⭐ Sketch principal integrado (el que se usa)
│   ├── clima_aht/                # Solo clima (AHT) — versión mínima/didáctica
│   ├── ble/                      # Experimentos BLE (reloj Xiaomi — ver nota)
│   │   ├── BLE-detector/
│   │   ├── BLE-explorer/
│   │   └── ble_scan_detallado/
│   └── keypad/                   # Pruebas de teclado matricial (etapa 2)
│       ├── keypad_detector/
│       └── keypad_test/
├── servidor/
│   ├── servidor_ble_postgres.py  # Servidor Flask
│   ├── requirements.txt
│   └── ble.service               # Unidad systemd (arranca solo)
├── db/
│   ├── schema.sql                # Estructura de las tablas
│   ├── dump_completo.sql         # Estructura + datos (1529 filas)
│   ├── clima.csv                 # Export de 'clima' para Excel/pandas
│   └── README.md                 # Cómo restaurar la base
├── tools/
│   └── signos.sh                 # Script con menú de utilidades
└── docs/
    └── ESTADO_MIGRACION_RASP.md  # Notas: migrar el servidor a Raspberry Pi
```

> ⚠️ **Configurá tus credenciales antes de compilar.** En los `.ino` el WiFi y la IP del
> servidor están como *placeholders*: editá `WIFI_SSID`, `WIFI_PASS` y `SERVIDOR`.

---

## 🔌 Hardware y conexiones

### Sensor AHT (ambiente) — I2C
| AHT | ESP32 |
|-----|-------|
| VIN | 3V3 |
| GND | GND |
| SCL | GPIO 22 |
| SDA | GPIO 21 |

> El sensor **no es un DHT11** aunque lo parezca: es un **AHT (I2C, dir. 0x38)**.
> Da lecturas con 2 decimales y usa la librería `Adafruit_AHTX0`.

### Otros pines (sketch `estacion_vitales`)
| Componente | Pin ESP32 |
|---|---|
| UV (CJMCU/ML8511) OUT | GPIO 34 (solo-entrada ADC1) |
| OLED SH1106 | mismo bus I2C (21/22) |
| LED RGB | 5 / 18 / 19 |
| Zumbador | 4 |

---

## ▶️ Puesta en marcha

### 1. Servidor (PC o Raspberry Pi)

> En Ubuntu 24.04+ `pip install` global lanza el error `externally-managed-environment`
> (PEP 668). Los scripts de abajo usan un entorno virtual en `servidor/.venv` y lo crean
> automáticamente la primera vez.

```bash
cd servidor

# a) base de datos (crea usuario + base + esquema; pide tu contraseña sudo)
./setup_db.sh

# b) correr el servidor (crea el venv e instala dependencias si faltan)
./run.sh
# servidor en http://localhost:5000
```

Si no tienes PostgreSQL instalado (o no puedes usar `sudo`), levántalo con Docker
desde `backend/`. Usa el mismo usuario, clave y puerto que los valores por defecto:

```bash
cd backend
docker compose up -d     # PostgreSQL 16 en localhost:5432 (datos en el volumen orbita-pgdata)
cd servidor
./run.sh                 # las tablas se crean solas al arrancar Flask
```

Pasos equivalentes manuales, si los prefieres:

```bash
# entorno virtual
cd servidor
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# base de datos (ver db/README.md)
sudo -u postgres psql -c "CREATE USER ble_user WITH PASSWORD 'cambia_esta_clave';"
sudo -u postgres psql -c "CREATE DATABASE ble OWNER ble_user;"
PGPASSWORD=cambia_esta_clave psql -h localhost -U ble_user -d ble -f ../db/schema.sql

# correr
.venv/bin/python servidor_ble_postgres.py
# o instalar como servicio: copiar servidor/ble.service a /etc/systemd/system/ y
#   sudo systemctl enable --now ble.service
```
Ver en el navegador: `http://<IP-del-servidor>:5000/clima/ver`

### 2. Firmware (ESP32)
1. Editar `firmware/estacion_vitales/estacion_vitales.ino`: `WIFI_SSID`, `WIFI_PASS`,
   `SERVIDOR` (la IP del servidor).
2. Compilar y subir con **arduino-cli**:
   - FQBN: `esp32:esp32:esp32:FlashMode=dio,FlashFreq=40` (**DIO obligatorio** en esta placa)
   - Puerto: `/dev/ttyUSB0`
   - Librerías: `Adafruit AHTX0`, `Adafruit Unified Sensor`, driver OLED SH1106.

### Modos del sketch principal (arriba del archivo)
| `#define` | Efecto |
|---|---|
| `SIMULAR_VITALES true` | pulso/SpO₂/temp corporal simulados (demo) |
| `MODO_DEMO true` | recorre 6 escenarios adversos de signos vitales (~16 s c/u) |

> En modo demo la **UV y el ambiente siguen siendo REALES** (sensores físicos); solo
> pulso/SpO₂/temp corporal se simulan. Para todo real: ambos `#define` en `false` + MAX30102.

---

## 🗄️ Servidor — endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/clima` | recibe JSON de la estación y lo guarda |
| `GET` | `/clima` | últimas 100 lecturas (JSON) |
| `GET` | `/clima/ver` | página HTML tipo tablero (refresca cada 5 s) |
| `POST/GET` | `/datos` | lecturas BLE (tabla `lecturas`, experimentos) |

Ejemplo de POST:
```json
{"detector":"esp32_astro","temperatura":27.9,"humedad":77.2,
 "uv":1.2,"pulso":78,"spo2":98,"temp_corp":36.6,"sim":true,"salud":92}
```

---

## 🛠️ Utilidad `tools/signos.sh`
```bash
./signos.sh ver | db | total | watch | status | logs | restart | monitor | subir | ip
```
(ver / base / conteo / en vivo / estado del servidor / logs / reiniciar / monitor serie /
compilar+subir / IP de la máquina)

---

## 📌 Estado y pendientes

| Módulo | Estado |
|---|---|
| Ambiente (AHT) | ✅ funcionando end-to-end |
| UV (CJMCU/ML8511) | ✅ integrado |
| OLED + avatar + salud + recomendaciones | ✅ funcionando |
| Signos vitales reales (MAX30102) | ⏳ pendiente (hoy simulados) |
| Radiación ionizante (Geiger/SBM-20) | 💡 opcional |
| Teclado matricial (etapa 2) | ⏳ pendiente (mapear pines) |
| Migrar servidor a Raspberry Pi 3B+ | ⏳ en curso (ver `docs/`) |

**Reloj deportivo (Xiaomi Smart Band 9):** descartado como fuente de pulso — la banda
cifra el ritmo cardiaco y rota su dirección BLE; no es leíble desde el ESP32. Los sketches
en `firmware/ble/` quedan como registro del intento. Reemplazo recomendado: **MAX30102**.

---

## Notas

- El **ESP32 solo ve WiFi de 2.4 GHz** y la **IP del servidor va fija** en el sketch:
  si cambiás de red, actualizá `SERVIDOR` y volvé a subir el firmware.
- La librería `ESP32_BLE_Arduino` no se versiona aquí (se instala aparte); está en
  `.gitignore`.
