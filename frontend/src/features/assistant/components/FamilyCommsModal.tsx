/**
 * FamilyCommsModal.tsx — Simulación de enlace y comunicación familiar para astronautas.
 *
 * NASA Space Apps Cochabamba — Reto "Create Health Monitoring Software for Astronauts"
 *
 * Modela el retardo de comunicaciones según el hábitat:
 * - Orbital: < 1 s (permite tiempo real)
 * - Lunar: 1.3 s ida / 2.6 s RTT (tiempo real con retardo perceptible)
 * - Marte: 14 min ida / 28 min RTT (bloquea tiempo real y fuerza mensajes asíncronos)
 *
 * AVISO VISIBLE: Simulación de enlace · No es una llamada real.
 */

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui";

export interface HabitatLatencyInfo {
  entorno: "orbital" | "lunar" | "marte";
  nombre: string;
  retardoIdaSegundos: number;
  retardoRttSegundos: number;
  descripcion: string;
  permiteTiempoReal: boolean;
}

export function calcularRetardoHabitat(entorno: string): HabitatLatencyInfo {
  const norm = entorno.toLowerCase();
  if (norm.includes("marte") || norm.includes("mars")) {
    return {
      entorno: "marte",
      nombre: "Base Marciana (Ares-01)",
      retardoIdaSegundos: 840, // 14 min
      retardoRttSegundos: 1680, // 28 min
      descripcion: "14 min ida / 28 min bidireccional",
      permiteTiempoReal: false,
    };
  }
  if (norm.includes("lunar") || norm.includes("moon")) {
    return {
      entorno: "lunar",
      nombre: "Base Lunar (Artemis)",
      retardoIdaSegundos: 1.3,
      retardoRttSegundos: 2.6,
      descripcion: "1.3 s ida / 2.6 s bidireccional",
      permiteTiempoReal: true,
    };
  }
  return {
    entorno: "orbital",
    nombre: "Estación Orbital (ISS / Gateway)",
    retardoIdaSegundos: 0.1,
    retardoRttSegundos: 0.2,
    descripcion: "< 1 s (enlace directo continuo)",
    permiteTiempoReal: true,
  };
}

interface FamilyCommsModalProps {
  entornoCodigo: string;
  nombreTripulante: string;
  language: "es" | "en";
  onClose: () => void;
}

interface MensajeSimulado {
  id: string;
  emisor: "astronauta" | "familia";
  texto: string;
  timestamp: string;
}

export function FamilyCommsModal({
  entornoCodigo,
  nombreTripulante,
  language,
  onClose,
}: FamilyCommsModalProps) {
  const infoLatency = calcularRetardoHabitat(entornoCodigo);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [progresoTransmision, setProgresoTransmision] = useState(0);

  const [mensajes, setMensajes] = useState<MensajeSimulado[]>([
    {
      id: "f-1",
      emisor: "familia",
      texto:
        language === "es"
          ? "¡Hola mamá! Te vimos pasar en el telescopio de la escuela hoy. ¡Te mandamos un abrazo gigante!"
          : "Hi Mom! We saw your station pass through the school telescope today. Sending you huge hugs!",
      timestamp: "Ayer · 19:40 UTC",
    },
    {
      id: "f-2",
      emisor: "familia",
      texto:
        language === "es"
          ? "Todo bien por casa. El huerto que plantaste antes de despegar ya tiene tomates. Cuídate mucho."
          : "All is well at home. The garden you planted before launch has fresh tomatoes. Take care of yourself.",
      timestamp: "Hoy · 08:15 UTC",
    },
  ]);

  // Accesibilidad: cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoMensaje.trim() || transmitiendo) return;

    const nuevoMensaje = textoMensaje.trim();
    setTextoMensaje("");
    setTransmitiendo(true);
    setProgresoTransmision(10);

    // Simular buffer de transmisión satelital DSN
    const intervalo = setInterval(() => {
      setProgresoTransmision((prev) => {
        if (prev >= 100) {
          clearInterval(intervalo);
          setTransmitiendo(false);

          setMensajes((m) => [
            ...m,
            {
              id: `msg-${Date.now()}`,
              emisor: "astronauta",
              texto: nuevoMensaje,
              timestamp: `${language === "es" ? "Enviado ahora" : "Sent just now"} · Transmitido vía DSN`,
            },
          ]);

          // Respuesta simulada cálida tras 2 segundos de demo
          setTimeout(() => {
            const RESPUESTAS_FAMILIA = [
              language === "es"
                ? "¡Recibimos tu nota con éxito! Nos alegra mucho saber que todo marcha bien allá arriba. ¡Fuerza tripulación!"
                : "Message received loud and clear! So happy to hear you are doing well up there. Stay strong crew!",
              language === "es"
                ? "Te extrañamos mucho por aquí, pero estamos muy orgullosos de tu trabajo. ¡Un beso enorme!"
                : "We miss you dearly here, but so proud of your mission. Sending you all our love!",
            ];
            const seleccionada = RESPUESTAS_FAMILIA[Math.floor(Math.random() * RESPUESTAS_FAMILIA.length)];
            setMensajes((m) => [
              ...m,
              {
                id: `reply-${Date.now()}`,
                emisor: "familia",
                texto: seleccionada,
                timestamp: `${language === "es" ? "Respuesta familiar simulada" : "Simulated family reply"} · UTC`,
              },
            ]);
          }, 2000);

          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(30, 16, 53, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          maxWidth: 620,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Cabecera del Enlace */}
        <header
          style={{
            background: "#1E1035",
            color: "#FFFFFF",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📡</span>
              <strong style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, fontWeight: 400 }}>
                {language === "es" ? "Enlace de Comunicación Familiar" : "Family Communications Uplink"}
              </strong>
            </div>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#C4B5FD" }}>
              {infoLatency.nombre} · {infoLatency.descripcion}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#C4B5FD",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px",
            }}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        {/* Banner de Estado del Retardo */}
        <div
          style={{
            background: infoLatency.permiteTiempoReal ? "#ECFDF5" : "#FFFBEB",
            borderBottom: `1px solid ${infoLatency.permiteTiempoReal ? "#A7F3D0" : "#FDE68A"}`,
            padding: "10px 20px",
            fontSize: 11,
            fontFamily: "Instrument Sans, sans-serif",
            color: infoLatency.permiteTiempoReal ? "#065F46" : "#92400E",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {infoLatency.permiteTiempoReal
              ? language === "es"
                ? "✓ Latencia bidireccional baja: voz directa permitida."
                : "✓ Low RTT latency: direct audio link supported."
              : language === "es"
              ? "⚠️ Retardo de 28 min bidireccional: la llamada en tiempo real está inhabilitada. Usa mensaje grabado asíncrono."
              : "⚠️ 28 min RTT delay: real-time live calls disabled. Use recorded asynchronous messages."}
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              background: "#FFFFFF",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            {infoLatency.permiteTiempoReal ? "VOZ DUPLEX" : "ASÍNCRONO"}
          </span>
        </div>

        {/* Zona de Mensajes */}
        <div
          style={{
            flex: 1,
            padding: 18,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "#F5F3FF",
          }}
        >
          {mensajes.map((m) => {
            const esMio = m.emisor === "astronauta";
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: esMio ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: esMio ? "#7C3AED" : "#FFFFFF",
                  color: esMio ? "#FFFFFF" : "#1E1035",
                  borderRadius: 14,
                  padding: "10px 14px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  fontFamily: "Instrument Sans, sans-serif",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <div>{m.texto}</div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 8.5,
                    color: esMio ? "rgba(255,255,255,0.7)" : "#5A5668",
                    marginTop: 4,
                    textAlign: esMio ? "right" : "left",
                  }}
                >
                  {m.timestamp}
                </div>
              </div>
            );
          })}

          {transmitiendo && (
            <div
              style={{
                alignSelf: "flex-end",
                background: "#EDE9FE",
                border: "1px dashed #7C3AED",
                borderRadius: 12,
                padding: "8px 14px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#7C3AED",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span>🚀 Transmitiendo a la Red de Espacio Profundo ({progresoTransmision}%)...</span>
              <div style={{ width: 140, height: 4, background: "#DDD6FE", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progresoTransmision}%`, height: "100%", background: "#7C3AED" }} />
              </div>
            </div>
          )}
        </div>

        {/* Formulario de Enlace */}
        <form
          onSubmit={handleEnviar}
          style={{
            padding: "12px 16px",
            background: "#FFFFFF",
            borderTop: "1px solid rgba(90, 86, 104, 0.2)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={textoMensaje}
            onChange={(e) => setTextoMensaje(e.target.value)}
            placeholder={
              language === "es"
                ? "Redacta un mensaje o nota de audio para tu familia..."
                : "Draft a text or voice memo for your family..."
            }
            disabled={transmitiendo}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(90, 86, 104, 0.3)",
              fontFamily: "Instrument Sans, sans-serif",
              fontSize: 12.5,
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={transmitiendo || !textoMensaje.trim()}
            style={{
              background: "#7C3AED",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "8px 18px",
              fontFamily: "Instrument Sans, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: transmitiendo ? "not-allowed" : "pointer",
              opacity: transmitiendo || !textoMensaje.trim() ? 0.6 : 1,
            }}
          >
            {language === "es" ? "Transmitir" : "Transmit"}
          </button>
        </form>

        {/* Footer Obligatorio */}
        <footer
          style={{
            background: "#F9FAFB",
            borderTop: "1px solid #E5E7EB",
            padding: "8px 16px",
            textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            color: "#6B7280",
          }}
        >
          ⚠️ {language === "es" ? "Simulación de enlace · No es una llamada real" : "Link simulation · Not a real telephone call"}
        </footer>
      </div>
    </div>
  );
}
