#!/usr/bin/env python3
import os
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)

DB_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "dbname": os.getenv("PGDATABASE", "ble"),
    "user": os.getenv("PGUSER", "ble_user"),
    "password": os.getenv("PGPASSWORD", "cambia_esta_clave"),
}


@contextmanager
def cursor():
    con = psycopg2.connect(**DB_CONFIG)
    try:
        with con:
            with con.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
    finally:
        con.close()


def crear_tabla():
    with cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS lecturas (
                id       SERIAL PRIMARY KEY,
                fecha    TIMESTAMPTZ NOT NULL DEFAULT now(),
                detector TEXT NOT NULL,
                mac      TEXT,
                nombre   TEXT,
                rssi     INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_lecturas_fecha ON lecturas (fecha DESC);
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS clima (
                id          SERIAL PRIMARY KEY,
                fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
                detector    TEXT NOT NULL,
                temperatura REAL,
                humedad     REAL
            );
            CREATE INDEX IF NOT EXISTS idx_clima_fecha ON clima (fecha DESC);
        """)
        # columnas extra (se agregan si la tabla ya existia sin ellas)
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS uv REAL;")
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS pulso REAL;")
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS spo2 REAL;")
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS temp_corp REAL;")
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS sim BOOLEAN DEFAULT FALSE;")
        cur.execute("ALTER TABLE clima ADD COLUMN IF NOT EXISTS salud REAL;")


@app.post("/datos")
def recibir():
    d = request.get_json(silent=True)
    if not d or "dispositivos" not in d:
        return jsonify(error="JSON inválido"), 400
    detector = d.get("detector", "esp32")
    filas = [(detector, x.get("mac"), x.get("nombre", ""), x.get("rssi"))
             for x in d["dispositivos"]]
    if filas:
        with cursor() as cur:
            execute_values(cur,
                "INSERT INTO lecturas (detector, mac, nombre, rssi) VALUES %s", filas)
    print(f"{len(filas)} dispositivos recibidos de {detector}")
    return jsonify(ok=True, guardados=len(filas))


@app.get("/datos")
def listar():
    with cursor() as cur:
        cur.execute("SELECT * FROM lecturas ORDER BY id DESC LIMIT 100")
        filas = cur.fetchall()
    for f in filas:
        f["fecha"] = f["fecha"].isoformat(timespec="seconds")
    return jsonify(filas)


@app.post("/clima")
def recibir_clima():
    d = request.get_json(silent=True)
    if not d or ("temperatura" not in d and "humedad" not in d):
        return jsonify(error="JSON inválido: falta temperatura/humedad"), 400
    detector = d.get("detector", "esp32_aht")
    temp = d.get("temperatura")
    hum = d.get("humedad")
    uv = d.get("uv")
    pulso = d.get("pulso")
    spo2 = d.get("spo2")
    temp_corp = d.get("temp_corp")
    sim = bool(d.get("sim", False))
    salud = d.get("salud")
    with cursor() as cur:
        cur.execute(
            "INSERT INTO clima (detector, temperatura, humedad, uv, pulso, spo2, temp_corp, sim, salud) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (detector, temp, hum, uv, pulso, spo2, temp_corp, sim, salud))
    print(f"[ESTACION] {detector}: T={temp} H={hum} UV={uv} | "
          f"Pulso={pulso} SpO2={spo2} Tcorp={temp_corp} {'(SIM)' if sim else ''}")
    return jsonify(ok=True, pulso=pulso, spo2=spo2, temp_corp=temp_corp, sim=sim, salud=salud)


@app.get("/clima")
def listar_clima():
    with cursor() as cur:
        cur.execute("SELECT * FROM clima ORDER BY id DESC LIMIT 100")
        filas = cur.fetchall()
    for f in filas:
        f["fecha"] = f["fecha"].isoformat(timespec="seconds")
    return jsonify(filas)


PAGINA_CLIMA = """
<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="5"><title>Estación Astronauta</title>
<style>body{font-family:sans-serif;margin:2em}table{border-collapse:collapse}
td,th{border:1px solid #999;padding:4px 10px}th{background:#eee}</style></head>
<body><h2>Estación de Astronauta — signos vitales y ambiente</h2>
<p>Se actualiza cada 5 segundos. <b>SIM</b> = signo vital simulado (demo).</p>
<table><tr><th>Fecha</th><th>Salud (%)</th><th>Pulso (bpm)</th><th>SpO₂ (%)</th><th>Temp corp (°C)</th>
<th>UV</th><th>Amb (°C)</th><th>Hum (%)</th><th>Fuente</th></tr>
{% for f in filas %}<tr><td>{{ f.fecha.strftime('%H:%M:%S') }}</td>
<td><b>{{f.salud}}</b></td><td>{{f.pulso}}</td><td>{{f.spo2}}</td><td>{{f.temp_corp}}</td>
<td>{{f.uv}}</td><td>{{f.temperatura}}</td><td>{{f.humedad}}</td>
<td>{{f.detector}}{% if f.sim %} <b>SIM</b>{% endif %}</td></tr>{% endfor %}
</table></body></html>
"""


@app.get("/clima/ver")
def ver_clima():
    with cursor() as cur:
        cur.execute("SELECT * FROM clima ORDER BY id DESC LIMIT 50")
        filas = cur.fetchall()
    return render_template_string(PAGINA_CLIMA, filas=filas)


PAGINA = """
<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="5"><title>Detector BLE</title>
<style>body{font-family:sans-serif;margin:2em}table{border-collapse:collapse}
td,th{border:1px solid #999;padding:4px 10px}th{background:#eee}</style></head>
<body><h2>Últimas lecturas BLE</h2><p>Se actualiza cada 5 segundos.</p>
<table><tr><th>Fecha</th><th>Detector</th><th>MAC</th><th>Nombre</th><th>RSSI</th></tr>
{% for f in filas %}<tr><td>{{ f.fecha.strftime('%Y-%m-%d %H:%M:%S') }}</td>
<td>{{f.detector}}</td><td>{{f.mac}}</td><td>{{f.nombre}}</td><td>{{f.rssi}}</td></tr>{% endfor %}
</table></body></html>
"""


@app.get("/")
def inicio():
    with cursor() as cur:
        cur.execute("SELECT * FROM lecturas ORDER BY id DESC LIMIT 50")
        filas = cur.fetchall()
    return render_template_string(PAGINA, filas=filas)


if __name__ == "__main__":
    crear_tabla()
    app.run(host="0.0.0.0", port=5000)
