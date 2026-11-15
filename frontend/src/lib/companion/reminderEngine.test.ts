import { describe, it, expect, beforeEach } from "vitest";
import {
  MissionClock,
  ReminderManager,
  generarRecordatoriosBase,
  horaAMinutos,
  minutosAHora,
} from "./reminderEngine";

describe("Motor de Recordatorios y Reloj de Misión (reminderEngine)", () => {
  it("convierte correctamente entre 'HH:MM' y minutos", () => {
    expect(horaAMinutos("00:00")).toBe(0);
    expect(horaAMinutos("07:30")).toBe(450);
    expect(horaAMinutos("12:30")).toBe(750);
    expect(horaAMinutos("23:59")).toBe(1439);

    expect(minutosAHora(0)).toBe("00:00");
    expect(minutosAHora(450)).toBe("07:30");
    expect(minutosAHora(750)).toBe("12:30");
  });

  it("el reloj avanza con precisión a velocidades 1x, 60x y 600x", () => {
    const reloj = new MissionClock("08:00", 42);
    expect(reloj.obtenerTextoHora()).toBe("08:00");
    expect(reloj.obtenerCabeceraMet()).toBe("MET Día 42 · 08:00 UTC");

    // 1x: 60 segundos reales = 1 minuto simulado
    reloj.setVelocidad(1);
    reloj.tick(60);
    expect(reloj.obtenerTextoHora()).toBe("08:01");

    // 60x: 1 segundo real = 1 minuto simulado
    reloj.setVelocidad(60);
    reloj.tick(5); // 5 segundos = 5 minutos
    expect(reloj.obtenerTextoHora()).toBe("08:06");

    // 600x: 1 segundo real = 10 minutos simulados
    reloj.setVelocidad(600);
    reloj.tick(3); // 3 segundos = 30 minutos
    expect(reloj.obtenerTextoHora()).toBe("08:36");
  });

  it("salta automáticamente al horario del próximo aviso pendiente", () => {
    const reloj = new MissionClock("07:00", 42);
    const manager = new ReminderManager(0);
    const recordatorios = manager.getRecordatorios();

    const siguiente = reloj.saltarAlProximoAviso(recordatorios);
    expect(siguiente).toBeDefined();
    expect(siguiente?.hora_programada).toBe("07:30"); // Primer aviso del día es desayuno
    expect(reloj.obtenerTextoHora()).toBe("07:30");
  });

  it("dispara los recordatorios al alcanzar la hora programada", () => {
    const manager = new ReminderManager(0);

    // A las 07:29 no debe dispararse el desayuno de las 07:30 (min 450)
    const disparadosAntes = manager.evaluarDisparo(449);
    expect(disparadosAntes.some((r) => r.id === "rec-desayuno")).toBe(false);

    // A las 07:30 (min 450) se dispara
    const disparadosEnPunto = manager.evaluarDisparo(450);
    expect(disparadosEnPunto.some((r) => r.id === "rec-desayuno")).toBe(true);

    const desayuno = manager.getRecordatorios().find((r) => r.id === "rec-desayuno");
    expect(desayuno?.estado).toBe("mostrado");
  });

  it("posponer reprograma a +10 minutos", () => {
    const manager = new ReminderManager(0);
    manager.evaluarDisparo(450); // Desayuno a las 07:30 (min 450)

    const pospuesto = manager.posponer("rec-desayuno", 450, 10);
    expect(pospuesto).toBe(true);

    const item = manager.getRecordatorios().find((r) => r.id === "rec-desayuno");
    expect(item?.estado).toBe("pospuesto");
    expect(item?.pospuesto_hasta_min).toBe(460); // 07:40

    // A las 07:35 no debe dispararse
    const dispIntermedio = manager.evaluarDisparo(455);
    expect(dispIntermedio.some((r) => r.id === "rec-desayuno")).toBe(false);

    // A las 07:40 (min 460) vuelve a dispararse
    const dispPospuesto = manager.evaluarDisparo(460);
    expect(dispPospuesto.some((r) => r.id === "rec-desayuno")).toBe(true);
  });

  it("semáforo nivel 2 o 3 añade recordatorios de respiración guiada", () => {
    const recordatoriosNivel0 = generarRecordatoriosBase(0);
    const respiracionesN0 = recordatoriosNivel0.filter((r) => r.categoria === "respiracion");
    expect(respiracionesN0.length).toBe(0);

    const recordatoriosNivel2 = generarRecordatoriosBase(2);
    const respiracionesN2 = recordatoriosNivel2.filter((r) => r.categoria === "respiracion");
    expect(respiracionesN2.length).toBeGreaterThanOrEqual(4);

    const recordatoriosNivel3 = generarRecordatoriosBase(3);
    const respiracionesN3 = recordatoriosNivel3.filter((r) => r.categoria === "respiracion");
    expect(respiracionesN3.length).toBeGreaterThanOrEqual(4);
  });
});
