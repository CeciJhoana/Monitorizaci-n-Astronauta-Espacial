import type { CrewMember, Measurement } from "@/types";

/** Métricas agregadas de la tripulación para las tarjetas del panel. */
export interface CrewMetrics {
  averageHeartRate: number;
  averageSleepHours: number;
  averageWellnessScore: number;
  membersInRange: number;
  membersUnderReview: number;
}

export function computeCrewMetrics(crew: CrewMember[]): CrewMetrics {
  const total = crew.length || 1;
  const sum = (pick: (member: CrewMember) => number) =>
    crew.reduce((accumulator, member) => accumulator + pick(member), 0);

  return {
    averageHeartRate: Math.round(sum((m) => m.heartRate) / total),
    averageSleepHours: Math.round((sum((m) => m.sleepHours) / total) * 10) / 10,
    averageWellnessScore: Math.round(sum((m) => m.wellnessScore) / total),
    membersInRange: crew.filter((m) => !m.requiresReview).length,
    membersUnderReview: crew.filter((m) => m.requiresReview).length,
  };
}

export function findCrewMember(crew: CrewMember[], id: string): CrewMember | undefined {
  return crew.find((member) => member.id === id);
}

/** Última medición registrada de un tripulante (o undefined). */
export function latestMeasurement(
  measurements: Measurement[],
  astronautId: string,
): Measurement | undefined {
  return [...measurements].reverse().find((measurement) => measurement.astronautId === astronautId);
}
