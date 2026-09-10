import {
  addDaysToDateString,
  chileWallTimeToUtc,
  weekdayOf,
} from "./chileTime";

export type BookingWindowSettings = {
  /** Con cuántos días de anticipación como máximo se puede reservar. */
  bookingOpenDays: number;
  /** Con cuántos minutos de anticipación se cierra la inscripción. */
  bookingCloseMinutes: number;
  /** Con cuántas horas de anticipación hay que cancelar para no perder el crédito. */
  cancelWindowHours: number;
};

const SATURDAY = 6;
const SATURDAY_RELEASE_DAYS_BEFORE = 2; // jueves = sábado − 2 días
const SATURDAY_RELEASE_HOUR = 22;
const SATURDAY_RELEASE_MINUTE = 30;

type SessionWindow = { date: string; startsAt: Date };

/**
 * Instante (UTC real) desde el cual se puede reservar una sesión.
 *
 * El sábado tiene una regla especial y más restrictiva que la ventana
 * general: la propia web del gimnasio dice que "los cupos del sábado se
 * activan el jueves a las 22:30" — no basta con estar dentro de los 30 días
 * de anticipación, hay que esperar ese momento puntual.
 */
export function bookingOpensAt(
  session: SessionWindow,
  settings: BookingWindowSettings
): Date {
  if (weekdayOf(session.date) === SATURDAY) {
    const thursday = addDaysToDateString(
      session.date,
      -SATURDAY_RELEASE_DAYS_BEFORE
    );
    const [y, m, d] = thursday.split("-").map(Number);
    return chileWallTimeToUtc(
      y,
      m,
      d,
      SATURDAY_RELEASE_HOUR,
      SATURDAY_RELEASE_MINUTE
    );
  }
  const opensAt = new Date(session.startsAt);
  opensAt.setUTCDate(opensAt.getUTCDate() - settings.bookingOpenDays);
  return opensAt;
}

/** Instante en que se cierra la inscripción a una sesión. */
export function bookingClosesAt(
  session: { startsAt: Date },
  settings: BookingWindowSettings
): Date {
  return new Date(
    session.startsAt.getTime() - settings.bookingCloseMinutes * 60_000
  );
}

export type BookingEligibility =
  | { ok: true }
  | { ok: false; reason: "too_early" | "too_late" | "session_cancelled" };

export function canBookSession(
  session: SessionWindow & { status: "scheduled" | "cancelled" },
  settings: BookingWindowSettings,
  now: Date = new Date()
): BookingEligibility {
  if (session.status === "cancelled") {
    return { ok: false, reason: "session_cancelled" };
  }
  if (now < bookingOpensAt(session, settings)) {
    return { ok: false, reason: "too_early" };
  }
  if (now > bookingClosesAt(session, settings)) {
    return { ok: false, reason: "too_late" };
  }
  return { ok: true };
}

/**
 * Si el alumno cancela con al menos `cancelWindowHours` de anticipación,
 * recupera el crédito. Cancelar tarde y el no-show (no llegar sin avisar)
 * se tratan igual: el crédito se pierde — así lo decidió el gimnasio.
 */
export function cancelRefundsCredit(
  session: { startsAt: Date },
  settings: BookingWindowSettings,
  now: Date = new Date()
): boolean {
  const deadline = new Date(
    session.startsAt.getTime() - settings.cancelWindowHours * 60 * 60_000
  );
  return now <= deadline;
}
