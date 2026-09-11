/**
 * Utilidades de huso horario para Chile (America/Santiago), sin depender de
 * una librería externa ni de un offset fijo hardcodeado — Chile ha cambiado
 * su política de horario de verano más de una vez en la última década, así
 * que cualquier constante tipo "UTC-4" es una bomba de tiempo. En cambio,
 * se le pregunta a `Intl` cómo se ve un instante en esa zona y se despeja
 * el offset real vigente en ese momento.
 *
 * El servidor (funciones de Vercel) siempre corre en UTC — estas funciones
 * son las que traducen entre "lo que el alumno ve en su reloj en Viña del
 * Mar" y el instante real que hay que comparar contra `new Date()`.
 */

const CHILE_TZ = "America/Santiago";

/** Convierte una hora "de pared" en Chile (año, mes, día, hora, minuto) al
 * instante UTC real que representa. */
export function chileWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: CHILE_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(utcGuess).map(p => [p.type, p.value])
  ) as Record<string, string>;
  // Intl a veces devuelve "24" para la medianoche en vez de "00".
  const hourPart = Number(parts.hour) % 24;
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hourPart,
    Number(parts.minute),
    Number(parts.second)
  );
  const offsetMs = utcGuess.getTime() - asIfUtc;
  return new Date(utcGuess.getTime() + offsetMs);
}

/** "YYYY-MM-DD" tal como se ve una fecha/instante en Chile. */
export function chileDateString(instant: Date = new Date()): string {
  // en-CA da formato YYYY-MM-DD directamente.
  return new Intl.DateTimeFormat("en-CA", { timeZone: CHILE_TZ }).format(
    instant
  );
}

/** Día de la semana (0=domingo…6=sábado) de una fecha "YYYY-MM-DD". No
 * involucra ninguna hora del día, así que no hay ambigüedad de huso. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Suma (o resta, con `days` negativo) días de calendario a "YYYY-MM-DD". */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
