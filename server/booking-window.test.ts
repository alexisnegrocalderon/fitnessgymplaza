import { describe, expect, it } from "vitest";
import {
  bookingClosesAt,
  bookingOpensAt,
  cancelRefundsCredit,
  canBookSession,
} from "../shared/booking";
import { chileWallTimeToUtc, weekdayOf } from "../shared/chileTime";

const settings = {
  bookingOpenDays: 30,
  bookingCloseMinutes: 30,
  cancelWindowHours: 2,
};

describe("chileTime", () => {
  it("calcula el día de la semana sin ambigüedad de huso horario", () => {
    // 2026-09-12 es un sábado.
    expect(weekdayOf("2026-09-12")).toBe(6);
    // 2026-09-10 es un jueves.
    expect(weekdayOf("2026-09-10")).toBe(4);
  });

  it("convierte una hora de pared en Chile a un instante UTC que, leído de vuelta en Chile, da la misma hora", () => {
    const utc = chileWallTimeToUtc(2026, 9, 10, 22, 30);
    const readBack = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(utc);
    expect(readBack.replace(/^24/, "00")).toBe("22:30");
  });
});

describe("bookingOpensAt", () => {
  it("para un día normal, abre exactamente bookingOpenDays antes del inicio", () => {
    const session = {
      date: "2026-09-15",
      startsAt: new Date("2026-09-15T12:00:00Z"),
    };
    const opensAt = bookingOpensAt(session, settings);
    const expected = new Date("2026-08-16T12:00:00Z");
    expect(opensAt.getTime()).toBe(expected.getTime());
  });

  it("para un sábado, abre el jueves de esa semana a las 22:30 de Chile", () => {
    const session = {
      date: "2026-09-12",
      startsAt: new Date("2026-09-12T13:30:00Z"),
    };
    const opensAt = bookingOpensAt(session, settings);
    const expectedThursday = chileWallTimeToUtc(2026, 9, 10, 22, 30);
    expect(opensAt.getTime()).toBe(expectedThursday.getTime());
    // Y esa apertura debe ser mucho más tardía que si aplicara la regla
    // general de 30 días — es la restricción especial haciendo su trabajo.
    const generalOpensAt = new Date(session.startsAt);
    generalOpensAt.setUTCDate(generalOpensAt.getUTCDate() - 30);
    expect(opensAt.getTime()).toBeGreaterThan(generalOpensAt.getTime());
  });
});

describe("canBookSession", () => {
  const session = {
    date: "2026-09-15",
    startsAt: new Date("2026-09-15T12:00:00Z"),
    status: "scheduled" as const,
  };

  it("rechaza si es demasiado pronto (fuera de la ventana de 30 días)", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    expect(canBookSession(session, settings, now)).toEqual({
      ok: false,
      reason: "too_early",
    });
  });

  it("acepta dentro de la ventana", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(canBookSession(session, settings, now)).toEqual({ ok: true });
  });

  it("rechaza si ya pasó el cierre de inscripción (30 min antes)", () => {
    const now = new Date("2026-09-15T11:45:00Z");
    expect(canBookSession(session, settings, now)).toEqual({
      ok: false,
      reason: "too_late",
    });
  });

  it("rechaza si la sesión está cancelada, sin importar la fecha", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(
      canBookSession({ ...session, status: "cancelled" }, settings, now)
    ).toEqual({ ok: false, reason: "session_cancelled" });
  });

  it("acepta justo en el borde del cierre de inscripción", () => {
    const closesAt = bookingClosesAt(session, settings);
    expect(canBookSession(session, settings, closesAt)).toEqual({ ok: true });
  });
});

describe("cancelRefundsCredit", () => {
  const session = { startsAt: new Date("2026-09-15T12:00:00Z") };

  it("devuelve el crédito si cancela con más de cancelWindowHours de anticipación", () => {
    const now = new Date("2026-09-15T09:00:00Z"); // 3h antes
    expect(cancelRefundsCredit(session, settings, now)).toBe(true);
  });

  it("no devuelve el crédito si cancela dentro de la ventana de 2h", () => {
    const now = new Date("2026-09-15T11:00:00Z"); // 1h antes
    expect(cancelRefundsCredit(session, settings, now)).toBe(false);
  });

  it("es inclusivo justo en el borde de las 2 horas", () => {
    const now = new Date("2026-09-15T10:00:00Z"); // exactamente 2h antes
    expect(cancelRefundsCredit(session, settings, now)).toBe(true);
  });
});
