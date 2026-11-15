/**
 * ExerciseGamificationModal.tsx — Centro de Gamificación de Contramedidas y Ejercicios.
 *
 * Basado en la Ley de Wolff y el material educativo del Dr. Alberto Sanagustín:
 * "CÓMO los ASTRONAUTAS FORTALECEN sus HUESOS (y TÚ TAMBIÉN PUEDES)"
 * https://www.youtube.com/watch?v=g8w1DbU6owU
 *
 * Características:
 * 1. Sistema de Gamificación: XP de densidad ósea, niveles espaciales, rachas y medallas.
 * 2. Catálogo de Ejercicios de Carga Axial (Ley de Wolff) y Estiramientos de Descompresión Espinal.
 * 3. Temporizador interactivo en tiempo real con locución motivacional del Asistente ASTRA.
 * 4. Tarjeta de divulgación científica con enlace directo al video del Dr. Alberto Sanagustín.
 */

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui";

export interface ExerciseItem {
  id: string;
  category: "fuerza_wolff" | "estiramientos";
  title: { es: string; en: string };
  targetZone: { es: string; en: string };
  durationSeconds: number;
  xpPoints: number;
  description: { es: string; en: string };
  clinicalRationale: { es: string; en: string };
  scientificLaw: { es: string; en: string };
  badgeId: string;
  icon: string;
}

export interface LevelInfo {
  level: number;
  title: { es: string; en: string };
  currentXp: number;
  currentLevelFloor: number;
  nextLevelCeiling: number;
  progressPercent: number;
}

export const EXERCISE_CATALOG: ExerciseItem[] = [
  {
    id: "sentadilla_wolff",
    category: "fuerza_wolff",
    title: {
      es: "Sentadillas de Carga Axial (Ley de Wolff)",
      en: "Axial Load Squats (Wolff's Law)",
    },
    targetZone: {
      es: "Fémur, cuello femoral y columna lumbar",
      en: "Femur, femoral neck and lumbar spine",
    },
    durationSeconds: 45,
    xpPoints: 40,
    description: {
      es: "3 series de 10 repeticiones. Pies al ancho de hombros, desciende a 90° sosteniendo la tensión en cuádriceps y glúteos.",
      en: "3 sets of 10 repetitions. Feet shoulder-width apart, descend to 90° maintaining tension in quads and glutes.",
    },
    clinicalRationale: {
      es: "La compresión mecánica axial sobre fémur y vértebras activa los osteoblastos y previene la desmineralización acelerada.",
      en: "Axial mechanical compression on femur and vertebrae activates osteoblasts and halts accelerated demineralization.",
    },
    scientificLaw: {
      es: "Ley de Wolff: El hueso se remodela y engrosa respondiendo directamente a la carga y al impacto aplicado.",
      en: "Wolff's Law: Bone remodels and thickens in direct response to applied physical load and impact.",
    },
    badgeId: "badge_wolff_master",
    icon: "activity",
  },
  {
    id: "descompresion_columna",
    category: "estiramientos",
    title: {
      es: "Descompresión Espinal y Lumbar Zero-G",
      en: "Zero-G Spinal Decompression Stretch",
    },
    targetZone: {
      es: "Discos intervertebrales y fascia toracolumbar",
      en: "Intervertebral discs and thoracolumbar fascia",
    },
    durationSeconds: 30,
    xpPoints: 25,
    description: {
      es: "Lleva ambas rodillas hacia el pecho en suspensión o flexionando suavemente la espalda para relajar las carillas articulares.",
      en: "Bring both knees towards the chest in suspension or gently curving the back to relieve facet joint tension.",
    },
    clinicalRationale: {
      es: "En microgravedad la columna se alarga hasta 7 cm por hidratación discal sin gravedad, provocando lumbalgia espacial.",
      en: "In microgravity the spine elongates up to 7 cm due to disc hydration without gravity, triggering space adaptation back pain.",
    },
    scientificLaw: {
      es: "Mecánica articular: Flexión pasiva sostenida para descompresión foraminal y reducción de espasmo paravertebral.",
      en: "Joint mechanics: Sustained passive flexion for foraminal decompression and paravertebral spasm reduction.",
    },
    badgeId: "badge_spine_relief",
    icon: "shield",
  },
  {
    id: "isometrico_mamparo",
    category: "fuerza_wolff",
    title: {
      es: "Empuje Isométrico de Mamparo (Pectoral y Deltoides)",
      en: "Bulkhead Isometric Push (Chest & Shoulders)",
    },
    targetZone: {
      es: "Húmero, cintura escapular, pectoral y tríceps",
      en: "Humerus, shoulder girdle, chest and triceps",
    },
    durationSeconds: 40,
    xpPoints: 35,
    description: {
      es: "Coloca las palmas contra dos mamparos opuestos y empuja al 80% de esfuerzo en series isométricas de 8 segundos.",
      en: "Place palms against opposing bulkheads and push at 80% effort in 8-second isometric holds.",
    },
    clinicalRationale: {
      es: "Compensa la ausencia de gravedad transmitiendo fuerza de corte y compresión a los huesos largos del miembro superior.",
      en: "Compensates for zero gravity by transmitting shear and compressive stress to upper limb long bones.",
    },
    scientificLaw: {
      es: "Ley de Wolff y piezoresistencia ósea: la deformación micrométrica del tejido óseo estimula la síntesis de colágeno.",
      en: "Wolff's Law & piezoelectricity: bone micrometric deformation triggers osteocyte signaling and collagen synthesis.",
    },
    badgeId: "badge_upper_strength",
    icon: "pulse",
  },
  {
    id: "estiramiento_aquiles",
    category: "estiramientos",
    title: {
      es: "Estiramiento de Cadena Posterior y Tendón de Aquiles",
      en: "Posterior Chain & Achilles Tendon Stretch",
    },
    targetZone: {
      es: "Gemelos, sóleo y fascia plantar",
      en: "Calves, soleus and plantar fascia",
    },
    durationSeconds: 30,
    xpPoints: 25,
    description: {
      es: "Tracción dorsal del pie con banda elástica o apoyo sobre mamparo. Sostén 15 segundos continuos por pierna sin rebote.",
      en: "Dorsiflexion pull with elastic band or bulkhead support. Hold 15 sustained seconds per leg without bouncing.",
    },
    clinicalRationale: {
      es: "Previene el acortamiento adaptativo del tendón calcáneo provocado por la postura de pie caído en ingravidez.",
      en: "Prevents adaptive shortening of the calcaneal tendon caused by passive 'drop foot' posture in weightlessness.",
    },
    scientificLaw: {
      es: "Flexibilidad miofascial: Elongación estática para preservar el arco de movilidad del tobillo para el retorno a gravedad.",
      en: "Myofascial flexibility: Static elongation to preserve ankle range of motion for terrestrial re-entry.",
    },
    badgeId: "badge_mobility_guard",
    icon: "wind",
  },
  {
    id: "puente_gluteo_pared",
    category: "fuerza_wolff",
    title: {
      es: "Isométrico de Cadera y Cabeza Femoral (Anti-Osteopenia)",
      en: "Hip & Femoral Head Isometric (Anti-Osteopenia)",
    },
    targetZone: {
      es: "Trocanter mayor, cuello de fémur y glúteo mayor",
      en: "Greater trochanter, femoral neck and gluteus maximus",
    },
    durationSeconds: 45,
    xpPoints: 40,
    description: {
      es: "Apoya los talones contra el soporte y activa glúteos e isquiotibiales empujando con fuerza mantenida.",
      en: "Brace heels against support and activate glutes and hamstrings pushing with sustained force.",
    },
    clinicalRationale: {
      es: "El cuello del fémur experimenta la mayor tasa de desmineralización en el espacio (~1.5% mensual). Requiere estímulo de choque.",
      en: "The femoral neck suffers the highest demineralization rate in space (~1.5% monthly). It demands targeted mechanical impulse.",
    },
    scientificLaw: {
      es: "Respuesta mecanotransductora de los osteocitos ante vectores de carga multidireccionales.",
      en: "Mechanotransductive response of osteocytes to multidirectional loading vectors.",
    },
    badgeId: "badge_femur_shield",
    icon: "heart",
  },
];

export const BADGE_DEFINITIONS: Record<
  string,
  { name: { es: string; en: string }; icon: string; desc: { es: string; en: string } }
> = {
  badge_wolff_master: {
    name: { es: "Guardián de Wolff", en: "Wolff's Guardian" },
    icon: "🦴",
    desc: {
      es: "Completaste carga axial protegiendo fémur y columna.",
      en: "Completed axial loading protecting femur and spine.",
    },
  },
  badge_spine_relief: {
    name: { es: "Columna Zero-G", en: "Zero-G Spine" },
    icon: "🚀",
    desc: {
      es: "Descomprimiste la elongación espinal de microgravedad.",
      en: "Decompressed microgravity spinal elongation.",
    },
  },
  badge_upper_strength: {
    name: { es: "Poder de Mamparo", en: "Bulkhead Power" },
    icon: "⚡",
    desc: {
      es: "Generaste piezoresistencia ósea en tren superior.",
      en: "Generated upper-body bone piezoelectricity.",
    },
  },
  badge_mobility_guard: {
    name: { es: "Movilidad Orbital", en: "Orbital Mobility" },
    icon: "🏃",
    desc: {
      es: "Evitaste el pie caído protegiendo el tendón de Aquiles.",
      en: "Prevented drop-foot preserving Achilles tendon flexibility.",
    },
  },
  badge_femur_shield: {
    name: { es: "Escudo Femoral", en: "Femoral Shield" },
    icon: "🛡️",
    desc: {
      es: "Fijaste calcio en la zona de mayor riesgo de osteopenia.",
      en: "Anchored calcium in the highest osteopenia risk area.",
    },
  },
};

export function calculateLevelInfo(xp: number): LevelInfo {
  if (xp < 100) {
    return {
      level: 1,
      title: { es: "Cadete Orbital", en: "Orbital Cadet" },
      currentXp: xp,
      currentLevelFloor: 0,
      nextLevelCeiling: 100,
      progressPercent: Math.min(100, Math.max(0, (xp / 100) * 100)),
    };
  }
  if (xp < 250) {
    return {
      level: 2,
      title: { es: "Guardián de Wolff", en: "Wolff's Guardian" },
      currentXp: xp,
      currentLevelFloor: 100,
      nextLevelCeiling: 250,
      progressPercent: Math.min(100, Math.max(0, ((xp - 100) / 150) * 100)),
    };
  }
  if (xp < 450) {
    return {
      level: 3,
      title: { es: "Especialista Musculoesquelético", en: "Musculoskeletal Specialist" },
      currentXp: xp,
      currentLevelFloor: 250,
      nextLevelCeiling: 450,
      progressPercent: Math.min(100, Math.max(0, ((xp - 250) / 200) * 100)),
    };
  }
  return {
    level: 4,
    title: { es: "Comandante Gravitacional", en: "Gravitational Commander" },
    currentXp: xp,
    currentLevelFloor: 450,
    nextLevelCeiling: 650,
    progressPercent: Math.min(100, Math.max(0, ((xp - 450) / 200) * 100)),
  };
}

interface ExerciseGamificationModalProps {
  language: "es" | "en";
  speak: (text: string) => void;
  onClose: () => void;
}

const STORAGE_KEY = "astra_exercise_gamification_v1";

export function ExerciseGamificationModal({
  language,
  speak,
  onClose,
}: ExerciseGamificationModalProps) {
  // Carga de estado persistido en localStorage
  const [xp, setXp] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return typeof parsed.xp === "number" ? parsed.xp : 120;
      }
    } catch {
      // fallback
    }
    return 120;
  });

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed.completedIds) ? parsed.completedIds : ["sentadilla_wolff"];
      }
    } catch {
      // fallback
    }
    return ["sentadilla_wolff"];
  });

  const [streakDays] = useState<number>(4);
  const [selectedCategory, setSelectedCategory] = useState<"todos" | "fuerza_wolff" | "estiramientos">("todos");
  const [activeExercise, setActiveExercise] = useState<ExerciseItem>(EXERCISE_CATALOG[0]);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(EXERCISE_CATALOG[0].durationSeconds);
  const [justEarnedXp, setJustEarnedXp] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp,
          completedIds,
        }),
      );
    } catch {
      // fallback local
    }
  }, [xp, completedIds]);

  // Tecla Escape para salir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Temporizador interactivo
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSecondsLeft === 0) {
      setIsTimerRunning(false);
      handleCompleteExercise(activeExercise);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timerSecondsLeft, activeExercise]);

  const levelInfo = calculateLevelInfo(xp);

  const handleSelectExercise = (item: ExerciseItem) => {
    setActiveExercise(item);
    setIsTimerRunning(false);
    setTimerSecondsLeft(item.durationSeconds);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    const mensajeInicio =
      language === "es"
        ? `Iniciando ${activeExercise.title.es}. Mantén la postura y siente el estímulo en tus huesos.`
        : `Starting ${activeExercise.title.en}. Keep form and feel the bone loading response.`;
    speak(mensajeInicio);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(activeExercise.durationSeconds);
  };

  const handleCompleteExercise = (item: ExerciseItem) => {
    setIsTimerRunning(false);
    const alreadyCompleted = completedIds.includes(item.id);
    const xpReward = alreadyCompleted ? Math.round(item.xpPoints * 0.5) : item.xpPoints;

    setXp((prev) => prev + xpReward);
    if (!alreadyCompleted) {
      setCompletedIds((prev) => [...prev, item.id]);
    }

    setJustEarnedXp(xpReward);
    setTimeout(() => setJustEarnedXp(null), 3000);

    const speech =
      language === "es"
        ? `¡Excelente esfuerzo! Sumaste ${xpReward} puntos de densidad ósea. La Ley de Wolff estimula la regeneración ósea.`
        : `Outstanding effort! You earned ${xpReward} bone density points. Wolff's Law is strengthening your bone tissue.`;
    speak(speech);
  };

  const filteredExercises = EXERCISE_CATALOG.filter((item) => {
    if (selectedCategory === "todos") return true;
    return item.category === selectedCategory;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 10, 30, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(124, 58, 237, 0.25), 0 4px 16px rgba(0,0,0,0.1)",
          border: "1px solid rgba(196, 181, 253, 0.6)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #1E1035 0%, #2A174B 100%)",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(196, 181, 253, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 22,
                background: "rgba(255, 255, 255, 0.12)",
                padding: "6px 10px",
                borderRadius: 10,
              }}
            >
              🏋️‍♂️
            </span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontFamily: "Instrument Serif, serif",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                }}
              >
                {language === "es"
                  ? "Gamificación de Contramedidas · Ley de Wolff"
                  : "Countermeasures Gamification · Wolff's Law"}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontFamily: "Instrument Sans, sans-serif",
                  color: "#C4B5FD",
                }}
              >
                {language === "es"
                  ? "Estimulación de densidad ósea y descompresión espinal en microgravedad"
                  : "Bone density stimulation and spinal decompression in microgravity"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal de ejercicios"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#FFFFFF",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Panel de Gamificación: Barra de Nivel, XP y Racha */}
        <div
          style={{
            padding: "14px 20px",
            backgroundColor: "#F5F3FF",
            borderBottom: "1px solid #E9D5FF",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Nivel y XP */}
          <div style={{ flex: "1 1 280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    backgroundColor: "#7C3AED",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  NIVEL {levelInfo.level}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1035", fontFamily: "Instrument Sans, sans-serif" }}>
                  {levelInfo.title[language]}
                </span>
              </div>
              <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "#6D28D9", fontWeight: 700 }}>
                {xp} / {levelInfo.nextLevelCeiling} XP
              </span>
            </div>

            {/* Barra de Progreso XP */}
            <div
              style={{
                height: 8,
                backgroundColor: "rgba(124, 58, 237, 0.15)",
                borderRadius: 999,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${levelInfo.progressPercent}%`,
                  background: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Racha y Recompensa emergente */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FEF3C7",
                border: "1px solid #FCD34D",
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                color: "#92400E",
                fontWeight: 600,
              }}
            >
              <span>🔥</span>
              <span>
                {language === "es" ? `Racha: ${streakDays} días` : `Streak: ${streakDays} days`}
              </span>
            </div>

            {justEarnedXp !== null && (
              <span
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  animation: "pulse 1s infinite",
                }}
              >
                +{justEarnedXp} XP 🦴
              </span>
            )}
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Tarjeta Educativa y Enlace al Video del Dr. Alberto Sanagustín */}
          <div
            style={{
              borderRadius: "12px",
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245, 243, 255, 0.9) 0%, rgba(237, 233, 254, 0.9) 100%)",
              border: "1px solid #C4B5FD",
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 380px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>📺</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#7C3AED",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {language === "es" ? "Referencia Científica y Fisiológica" : "Scientific & Physiological Reference"}
                </span>
              </div>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1E1035",
                  fontFamily: "Instrument Sans, sans-serif",
                }}
              >
                {language === "es"
                  ? "Cómo los astronautas fortalecen sus huesos (y tú también puedes)"
                  : "How astronauts strengthen their bones (and you can too)"}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#4B5563",
                  lineHeight: 1.45,
                }}
              >
                {language === "es"
                  ? "Por el Dr. Alberto Sanagustín: Explicación de la Ley de Wolff (remodelación ósea ante carga mecánica), impacto de la microgravedad y ejercicios cotidianos de fuerza e impacto."
                  : "By Dr. Alberto Sanagustín: Detailed explanation of Wolff's Law (bone remodeling under mechanical load), microgravity bone loss, and daily resistive countermeasure protocols."}
              </p>
            </div>

            <a
              href="https://www.youtube.com/watch?v=g8w1DbU6owU"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                padding: "8px 14px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "Instrument Sans, sans-serif",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
              }}
            >
              <span>▶</span>
              <span>{language === "es" ? "Ver video en YouTube" : "Watch on YouTube"}</span>
            </a>
          </div>

          {/* Entrenador Activo / Temporizador */}
          <div
            style={{
              borderRadius: "14px",
              padding: "16px 18px",
              backgroundColor: "#1E1035",
              color: "#FFFFFF",
              border: "1px solid rgba(196, 181, 253, 0.3)",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    backgroundColor: activeExercise.category === "fuerza_wolff" ? "#7C3AED" : "#0D9488",
                    color: "#FFFFFF",
                    fontSize: 9,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "JetBrains Mono, monospace",
                    textTransform: "uppercase",
                  }}
                >
                  {activeExercise.category === "fuerza_wolff"
                    ? language === "es"
                      ? "Fuerza · Ley de Wolff"
                      : "Strength · Wolff's Law"
                    : language === "es"
                      ? "Estiramiento · Zero-G"
                      : "Stretching · Zero-G"}
                </span>
                <span style={{ fontSize: 11, color: "#C4B5FD" }}>
                  +{activeExercise.xpPoints} XP
                </span>
              </div>

              <h4
                style={{
                  margin: "0 0 4px",
                  fontSize: 16,
                  fontFamily: "Instrument Serif, serif",
                  fontWeight: 400,
                }}
              >
                {activeExercise.title[language]}
              </h4>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 12,
                  color: "#E2E8F0",
                  lineHeight: 1.4,
                }}
              >
                {activeExercise.description[language]}
              </p>
              <div
                style={{
                  fontSize: 11,
                  color: "#FDE047",
                  fontStyle: "italic",
                }}
              >
                💡 {activeExercise.scientificLaw[language]}
              </div>
            </div>

            {/* Temporizador y Botones de Control */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                minWidth: "160px",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 32,
                  fontWeight: 700,
                  color: timerSecondsLeft <= 5 && isTimerRunning ? "#EF4444" : "#A78BFA",
                  letterSpacing: "0.05em",
                }}
              >
                00:{timerSecondsLeft.toString().padStart(2, "0")}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    style={{
                      backgroundColor: "#7C3AED",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>▶</span>
                    <span>{language === "es" ? "Iniciar" : "Start"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    style={{
                      backgroundColor: "#F59E0B",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ❚❚ {language === "es" ? "Pausar" : "Pause"}
                  </button>
                )}

                <button
                  onClick={handleResetTimer}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  title={language === "es" ? "Reiniciar cronómetro" : "Reset timer"}
                >
                  ↺
                </button>

                <button
                  onClick={() => handleCompleteExercise(activeExercise)}
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title={language === "es" ? "Completar rutina" : "Complete workout"}
                >
                  ✓ +XP
                </button>
              </div>
            </div>
          </div>

          {/* Filtros de Categoría */}
          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #E5E7EB", paddingBottom: 8 }}>
            <button
              onClick={() => setSelectedCategory("todos")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedCategory === "todos" ? "#7C3AED" : "#F3F4F6",
                color: selectedCategory === "todos" ? "#FFFFFF" : "#4B5563",
                fontWeight: 600,
              }}
            >
              {language === "es" ? "Todos los ejercicios (5)" : "All exercises (5)"}
            </button>
            <button
              onClick={() => setSelectedCategory("fuerza_wolff")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedCategory === "fuerza_wolff" ? "#7C3AED" : "#F3F4F6",
                color: selectedCategory === "fuerza_wolff" ? "#FFFFFF" : "#4B5563",
                fontWeight: 600,
              }}
            >
              🦴 {language === "es" ? "Carga Axial (Ley de Wolff)" : "Axial Load (Wolff's Law)"}
            </button>
            <button
              onClick={() => setSelectedCategory("estiramientos")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedCategory === "estiramientos" ? "#7C3AED" : "#F3F4F6",
                color: selectedCategory === "estiramientos" ? "#FFFFFF" : "#4B5563",
                fontWeight: 600,
              }}
            >
              🧘 {language === "es" ? "Estiramientos y Descompresión" : "Stretching & Decompression"}
            </button>
          </div>

          {/* Lista de Tarjetas de Ejercicios */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {filteredExercises.map((item) => {
              const isSelected = activeExercise.id === item.id;
              const isCompleted = completedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectExercise(item)}
                  style={{
                    borderRadius: 10,
                    padding: "12px",
                    backgroundColor: isSelected ? "#F5F3FF" : "#FFFFFF",
                    border: isSelected ? "2px solid #7C3AED" : "1px solid #E5E7EB",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: item.category === "fuerza_wolff" ? "rgba(124, 58, 237, 0.1)" : "rgba(13, 148, 136, 0.1)",
                          color: item.category === "fuerza_wolff" ? "#7C3AED" : "#0D9488",
                          fontWeight: 700,
                        }}
                      >
                        {item.category === "fuerza_wolff" ? "LEY DE WOLFF" : "ESTIRAMIENTO"}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>
                          ✓ {language === "es" ? "Hecho" : "Done"}
                        </span>
                      )}
                    </div>

                    <h5
                      style={{
                        margin: "0 0 4px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1E1035",
                      }}
                    >
                      {item.title[language]}
                    </h5>

                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        color: "#6B7280",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.targetZone[language]}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px dashed #E5E7EB",
                    }}
                  >
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#4B5563" }}>
                      ⏱ {item.durationSeconds}s
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>
                      +{item.xpPoints} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insignias de Gamificación */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#FAFAFA",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
            }}
          >
            <h5
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              🏆 {language === "es" ? "Insignias y Logros de Misión" : "Mission Badges & Achievements"}
            </h5>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.entries(BADGE_DEFINITIONS).map(([badgeKey, badge]) => {
                const isUnlocked =
                  completedIds.some(
                    (id) => EXERCISE_CATALOG.find((e) => e.id === id)?.badgeId === badgeKey,
                  ) || xp >= 200;

                return (
                  <div
                    key={badgeKey}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 8,
                      backgroundColor: isUnlocked ? "#FFFFFF" : "#F3F4F6",
                      border: isUnlocked ? "1px solid #C4B5FD" : "1px dashed #D1D5DB",
                      opacity: isUnlocked ? 1 : 0.6,
                    }}
                    title={badge.desc[language]}
                  >
                    <span style={{ fontSize: 14 }}>{badge.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isUnlocked ? "#1E1035" : "#9CA3AF",
                      }}
                    >
                      {badge.name[language]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "#F9FAFB",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            {language === "es"
              ? "Prototipo ASTRA · Las contramedidas físicas protegen hueso y músculo en misiones espaciales"
              : "ASTRA Prototype · Physical countermeasures protect bone and muscle during spaceflight"}
          </span>

          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid #D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#374151",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {language === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
