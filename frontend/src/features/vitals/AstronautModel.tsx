import { useState, type CSSProperties } from "react";
import { latestMeasurement } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";
import type { VitalKey } from "@/types";
import { buildVitalReadings, SENSOR_POSITIONS } from "./vitalsConfig";

/**
 * Modelo corporal interactivo del tripulante con cinco sensores
 * seleccionables y su detalle explicativo.
 */
export function AstronautModel() {
  const { crew, measurements } = useMissionData();
  const [personId, setPersonId] = useState(crew[0].id);
  const [selectedKey, setSelectedKey] = useState<VitalKey>("heart");
  const [animated, setAnimated] = useState(true);

  const member = crew.find((candidate) => candidate.id === personId) ?? crew[0];
  const latest = latestMeasurement(measurements, member.id);
  const vitals = buildVitalReadings(member, latest);
  const current = vitals.find((vital) => vital.key === selectedKey) ?? vitals[0];
  const respiratoryRate = Number(
    vitals.find((vital) => vital.key === "breathing")?.value ?? member.respiratoryRate,
  );

  const animationStyle = {
    "--heartbeat": `${60 / member.heartRate}s`,
    "--breath-cycle": `${60 / respiratoryRate}s`,
    "--vital-color": current.color,
  } as CSSProperties;

  return (
    <section
      className="panel astronaut-panel"
      aria-label="Visualización corporal de signos vitales"
    >
      <div className="astronaut-panel-heading">
        <div>
          <span className="eyebrow">TELEMETRÍA HUMANA / ARES–01</span>
          <h2>El astronauta, en el centro.</h2>
          <p>Explora el modelo y selecciona un sensor para conocer su lectura.</p>
        </div>
        <label className="astronaut-select-label">
          Tripulante
          <select
            aria-label="Tripulante del modelo virtual"
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            {crew.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={`astronaut-visualization ${animated ? "" : "animation-paused"}`}
        style={animationStyle}
      >
        <div className="astronaut-stage">
          <div className="astronaut-stage-meta">
            <span>
              MODELO BIOMÉTRICO <b>01 / FRONTAL</b>
            </span>
            <span className="astronaut-sim-label">SIMULACIÓN</span>
          </div>
          <svg
            className="astronaut-model"
            viewBox="0 0 400 455"
            aria-label={`Modelo virtual de ${member.name}. Cinco sensores seleccionables.`}
            role="group"
          >
            <defs>
              <linearGradient id="suit-fill" x1="0" y1="0" x2="1" y2=".3">
                <stop stopColor="#f9f7ff" />
                <stop offset=".5" stopColor="#e8e1f2" />
                <stop offset="1" stopColor="#d1c5e0" />
              </linearGradient>
              <linearGradient id="visor-fill" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#6d6480" />
                <stop offset="1" stopColor="#34394e" />
              </linearGradient>
              <linearGradient id="chest-fill" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#cac0df" stopOpacity=".7" />
                <stop offset="1" stopColor="#eee9f5" stopOpacity=".5" />
              </linearGradient>
              <pattern id="biometric-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M25 0H0V25" stroke="#d8cee6" strokeWidth=".55" fill="none" />
              </pattern>
            </defs>
            <rect x="33" y="15" width="334" height="410" fill="url(#biometric-grid)" opacity=".5" />
            <ellipse cx="200" cy="420" rx="95" ry="14" fill="#d7cbe5" opacity=".27" />
            <path d="M200 13v415M45 183h310" stroke="#cabbdc" strokeDasharray="3 6" opacity=".6" />
            <g fill="none" stroke="#bcaace" strokeWidth="1">
              <path d="M63 42V29h16m242 0h16v13M63 394v13h16m242 0h16v-13" />
              <ellipse cx="200" cy="258" rx="141" ry="43" strokeDasharray="3 5" opacity=".55" />
            </g>
            <g stroke="#b6a6ca" strokeWidth="1.5" strokeLinejoin="round">
              <rect x="142" y="123" width="116" height="124" rx="24" fill="#cfc2e0" />
              <path
                d="M157 139c-20-10-37-1-43 19l-25 85 20 10 35-66M243 139c20-10 37-1 43 19l25 85-20 10-35-66"
                fill="url(#suit-fill)"
              />
              <path
                d="m89 241-8 28c-3 12 0 20 9 22 9 2 16-4 19-14l6-27m196-9 8 28c3 12 0 20-9 22-9 2-16-4-19-14l-6-27"
                fill="url(#suit-fill)"
              />
              <path
                d="m86 251 24 8m179 0 24-8M105 208l24 9m142 0 24-9"
                fill="none"
                strokeWidth="5"
                stroke="#b6a4cd"
              />
              <path
                d="m151 245-8 73 2 74c1 12 31 14 34 1l11-72 10-42 10 42 11 72c3 13 33 11 34-1l2-74-8-73Z"
                fill="url(#suit-fill)"
              />
              <path
                d="m145 391-7 16c-2 8 4 10 14 10h19c8 0 10-3 9-12l-2-14m44 0-2 14c-1 9 1 12 9 12h19c10 0 16-2 14-10l-7-16"
                fill="#c1b1d2"
              />
              <path d="m146 331 35 4m38 0 35-4" stroke="#b9a7cf" strokeWidth="9" />
              <path
                d="M165 128c-17 9-26 27-25 48l8 65c1 17 103 17 104 0l8-65c1-21-8-39-25-48"
                fill="url(#suit-fill)"
              />
              <path
                d="M161 151q39-16 78 0l-3 60q-36 17-72 0Z"
                fill="url(#chest-fill)"
                stroke="#b8a9cd"
              />
              <path d="M157 232q43 13 86 0m-91 16q48 15 96 0" fill="none" strokeWidth="4" />
              <rect x="189" y="235" width="22" height="17" rx="4" fill="#b4a1ca" />
              <path d="M174 126v13q26 14 52 0v-13" fill="#b5a4c9" />
              <ellipse cx="200" cy="81" rx="49" ry="53" fill="url(#suit-fill)" />
              <rect x="147" y="70" width="10" height="28" rx="4" fill="#c4b4d6" />
              <rect x="243" y="70" width="10" height="28" rx="4" fill="#c4b4d6" />
              <path d="M164 68c2-28 70-28 72 0l-1 28c-1 23-69 23-70 0Z" fill="url(#visor-fill)" />
              <path
                d="M174 63c11-9 28-10 40-7"
                fill="none"
                stroke="#ece5f5"
                strokeWidth="3"
                opacity=".6"
                strokeLinecap="round"
              />
              <path d="M177 120q23 11 46 0" fill="none" stroke="#b8a6ce" strokeWidth="3" />
              <path d="M147 149h-16m122 0h16" stroke="#9e86bd" strokeWidth="5" />
            </g>
            <g
              className="virtual-lungs"
              fill="#8db9ad"
              fillOpacity={selectedKey === "breathing" ? ".65" : ".25"}
              stroke="#8daea8"
              strokeWidth="1"
            >
              <path d="M193 161c-8-5-20 6-24 22-4 17-2 23 9 24 10 0 15-8 15-17Z" />
              <path d="M207 161c8-5 20 6 24 22 4 17 2 23-9 24-10 0-15-8-15-17Z" />
              <path d="M200 154v22m0-7-9 8m9-8 9 8" fill="none" strokeWidth="2.5" />
            </g>
            <path
              className="virtual-heart"
              d="M207 181c-5-10-18-4-15 4 2 6 15 14 15 14s13-8 15-14c3-8-10-14-15-4Z"
              fill="#c98ca7"
              stroke="#b97b98"
              strokeWidth="1"
            />
            <path d="M168 219h17l4-7 5 13 5-8h33" fill="none" stroke="#a28cba" strokeWidth="1.2" />
            <text x="200" y="306" textAnchor="middle" className="suit-label">
              ARES–01
            </text>
            <text x="200" y="318" textAnchor="middle" className="suit-label suit-id">
              CREW {member.id}
            </text>
            {vitals.map((vital, index) => {
              const [x, y] = SENSOR_POSITIONS[vital.key];
              return (
                <g
                  key={vital.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver ${vital.label}: ${vital.value} ${vital.unit}`}
                  aria-pressed={selectedKey === vital.key}
                  className={`body-sensor ${selectedKey === vital.key ? "is-active" : ""}`}
                  onClick={() => setSelectedKey(vital.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedKey(vital.key);
                    }
                  }}
                >
                  <title>{vital.label}</title>
                  <circle cx={x} cy={y} r="17" fill="transparent" />
                  <circle
                    className="sensor-halo"
                    cx={x}
                    cy={y}
                    r="12"
                    fill={vital.color}
                    fillOpacity=".16"
                    stroke={vital.color}
                    strokeOpacity=".4"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill={selectedKey === vital.key ? vital.color : "#fdfaff"}
                    stroke={vital.color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={y + 2.7}
                    textAnchor="middle"
                    fill={selectedKey === vital.key ? "#fff" : vital.color}
                    fontSize="7"
                    fontWeight="600"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="astronaut-stage-bottom">
            <span>
              <i />
              {member.name} <small>· {member.role}</small>
            </span>
            <button onClick={() => setAnimated(!animated)} aria-pressed={!animated}>
              {animated ? "Pausar animación" : "Reanudar animación"}
            </button>
          </div>
        </div>

        <div className="body-readings">
          <div className="body-readings-header">
            <span>LECTURAS DEL TRIPULANTE</span>
            <small>{latest ? `Registro manual · ${latest.recordedAt}` : "Datos de ejemplo"}</small>
          </div>
          {vitals.map((vital, index) => (
            <button
              key={vital.key}
              className={`body-reading ${selectedKey === vital.key ? "selected" : ""}`}
              onClick={() => setSelectedKey(vital.key)}
              aria-pressed={selectedKey === vital.key}
              style={{ "--reading-color": vital.color } as CSSProperties}
            >
              <span className="reading-number">0{index + 1}</span>
              <span className="body-reading-name">
                {vital.label}
                <small>{vital.location.split(" · ")[0]}</small>
              </span>
              <strong>
                {vital.value}
                <small>{vital.unit}</small>
              </strong>
              <span className="reading-chevron">›</span>
            </button>
          ))}
          <div className="body-reading-detail" aria-live="polite">
            <span className="body-detail-location">{current.location}</span>
            <h3>{current.label}</h3>
            <p>{current.description}</p>
            <div>
              <span>Referencia personal simulada</span>
              <strong>{current.baseline}</strong>
            </div>
            {latest && (selectedKey === "heart" || selectedKey === "oxygen") && (
              <small>Mostrando tu último registro manual, sin evaluación clínica.</small>
            )}
          </div>
        </div>
      </div>

      <div className="astronaut-disclaimer">
        <span>MODELO ILUSTRATIVO</span>Los sensores y órganos son esquemáticos. No hay conexión a
        dispositivos ni evaluación médica.
      </div>
    </section>
  );
}
