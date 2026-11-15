# Base de datos — PostgreSQL

Base `ble`, usuario `ble_user`. Dos tablas: `clima` (datos de la estación) y
`lecturas` (experimentos BLE).

## Restaurar desde cero

```bash
# 1. crear usuario + base
sudo -u postgres psql -c "CREATE USER ble_user WITH PASSWORD 'cambia_esta_clave';"
sudo -u postgres psql -c "CREATE DATABASE ble OWNER ble_user;"

# 2a. solo estructura
PGPASSWORD=cambia_esta_clave psql -h localhost -U ble_user -d ble -f schema.sql

# 2b. o estructura + datos (1529 filas de clima)
PGPASSWORD=cambia_esta_clave psql -h localhost -U ble_user -d ble -f dump_completo.sql
```

## Archivos

| Archivo | Qué es |
|---|---|
| `schema.sql` | Solo la estructura (CREATE TABLE / índices) |
| `dump_completo.sql` | Estructura + todos los datos |
| `clima.csv` | Export de la tabla `clima` para abrir en Excel/pandas |

## Tabla `clima`

| Columna | Tipo | Descripción |
|---|---|---|
| id | serial | PK |
| fecha | timestamptz | se pone sola (`now()`) |
| detector | text | id del nodo (ej. `esp32_astro`) |
| temperatura | real | °C ambiente (AHT) |
| humedad | real | % ambiente (AHT) |
| uv | real | índice UV (sensor CJMCU/ML8511) |
| pulso | real | bpm |
| spo2 | real | % saturación O₂ |
| temp_corp | real | °C corporal |
| sim | boolean | `true` = signo vital simulado (demo) |
| salud | real | % de salud calculado |
