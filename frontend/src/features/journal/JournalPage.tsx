import { useState } from "react";
import { Badge, Icon, Panel } from "@/components/ui";
import { MOOD_OPTIONS } from "@/data/mockData";
import { findCrewMember } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";
import { useToast } from "@/store/ToastContext";
import type { Mood } from "@/types";

const JOURNAL_PROMPT = "¿Qué te ha hecho sentir conectado con tu tripulación?";

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

/** Página de bitácora: registro de ánimo, entradas guardadas y contexto. */
export function JournalPage() {
  const { crew, journal, addJournalEntry } = useMissionData();
  const { notify } = useToast();
  const commander = crew[0];
  const [mood, setMood] = useState<Mood>("Bien");
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!commander || !text.trim()) return;
    setIsSaving(true);
    await addJournalEntry({ astronautId: commander.id, mood, text: text.trim() });
    setText("");
    setIsSaving(false);
    notify("Entrada añadida a la bitácora");
  }

  const memberName = (astronautId: string) =>
    findCrewMember(crew, astronautId)?.name ?? astronautId;

  return (
    <div className="journal-layout">
      <section className="panel journal-panel">
        <span className="eyebrow">TU MOMENTO DE PAUSA</span>
        <h2>¿Cómo te sientes hoy, {commander ? firstName(commander.name) : "tripulante"}?</h2>
        <p>No todo lo importante se puede medir con un sensor.</p>
        <div className="mood-options">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={mood === option.value ? "selected" : ""}
              onClick={() => setMood(option.value)}
            >
              <span className={`mood-symbol mood-${MOOD_OPTIONS.indexOf(option)}`}>
                <Icon name={option.icon} size={23} />
              </span>
              {option.value}
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="journal">
          Tu bitácora del día
        </label>
        <textarea
          id="journal"
          rows={7}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="¿Qué te ha dado energía hoy? ¿Hay algo que quieras compartir o recordar?"
        />
        <div className="journal-actions">
          <span>
            <Icon name="shield" size={15} />
            Guardado local en este dispositivo
          </span>
          <button
            className="button primary"
            disabled={!text.trim() || isSaving}
            onClick={handleSave}
          >
            Guardar entrada
            <Icon name="check" size={16} />
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Tu perspectiva importa</h3>
          </div>
        </div>
        <div className="journal-tip">
          <Icon name="book" size={30} />
          <h3>
            Un pequeño registro.
            <br />
            Una visión más completa.
          </h3>
          <p>
            El estado de ánimo se registra tal como lo expresas. Este prototipo no analiza
            sentimientos ni calcula un diagnóstico psicológico.
          </p>
        </div>
        <div className="journal-prompt">
          <span>PREGUNTA PARA HOY</span>
          <p>{JOURNAL_PROMPT}</p>
        </div>
      </section>

      <section className="panel journal-entries">
        <div className="panel-title">
          <div>
            <h3>Entradas guardadas</h3>
          </div>
        </div>
        <div>
          {journal.length ? (
            journal.map((entry) => (
              <article className="journal-entry" key={entry.id}>
                <Badge tone="purple">{entry.mood}</Badge>
                <span>
                  Día {entry.missionDay} · {memberName(entry.astronautId)}
                </span>
                <p>{entry.text}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <Icon name="book" size={28} />
              <p>Tu próxima perspectiva empieza con unas palabras.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
