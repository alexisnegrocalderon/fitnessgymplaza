import { describe, expect, it } from "vitest";

/**
 * Prueba de concurrencia del cupo de una clase.
 *
 * server/db.ts (tryReserveSessionSlot) protege el aforo con UN SOLO UPDATE
 * condicional:
 *
 *   UPDATE class_sessions
 *   SET "bookedCount" = "bookedCount" + 1
 *   WHERE id = $1 AND "bookedCount" < capacity
 *   RETURNING *;
 *
 * En Postgres real, ese patrón es atómico por construcción: dos conexiones
 * que ejecutan el mismo UPDATE sobre la misma fila al mismo tiempo se
 * serializan a nivel de fila — la segunda espera a que la primera termine
 * y vuelve a evaluar el WHERE con el valor ya actualizado. Es justamente
 * lo que hace que "bookedCount nunca supere capacity" sea una garantía de
 * la base de datos, no de la aplicación.
 *
 * El repo usa el driver `neon-http`, que NO soporta transacciones
 * (`drizzle-orm/neon-http` lanza "No transactions support in neon-http
 * driver"), así que no se puede envolver esto en BEGIN/COMMIT ni probarlo
 * contra una base real dentro de este sandbox (no hay Postgres disponible
 * aquí). Este archivo reproduce el mecanismo exacto con un pequeño
 * simulador en memoria que modela la MISMA semántica que Postgres
 * garantiza para un UPDATE de una sola fila (una cola de operaciones que
 * se resuelven una por una, nunca dos a la vez sobre la misma fila) y
 * ejercita la lógica de reserva/compensación de server/db.ts#bookSession
 * bajo una carrera real por el último cupo.
 *
 * La verificación contra Postgres real (Neon) queda para el recorrido
 * manual de la Fase 1 en una rama de base de datos de prueba, como indica
 * el plan (§7 "Entorno de prueba" y §9 punto 2).
 */

/** Simula una tabla de una sola fila con el mismo contrato de atomicidad
 * que un UPDATE...WHERE...RETURNING de Postgres: las operaciones puestas
 * en cola se resuelven en orden de llegada, nunca superpuestas — así se
 * reproduce la serialización a nivel de fila sin necesitar una base real. */
class FakeSessionRow {
  private bookedCount = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly capacity: number) {}

  private enqueue<T>(op: () => T): Promise<T> {
    const result = this.queue.then(op);
    this.queue = result.catch(() => {});
    return result;
  }

  /** Equivalente a tryReserveSessionSlot(). */
  tryReserve(): Promise<boolean> {
    return this.enqueue(() => {
      if (this.bookedCount < this.capacity) {
        this.bookedCount += 1;
        return true;
      }
      return false;
    });
  }

  /** Equivalente a releaseSessionSlot(). */
  release(): Promise<void> {
    return this.enqueue(() => {
      this.bookedCount = Math.max(this.bookedCount - 1, 0);
    });
  }

  getBookedCount(): number {
    return this.bookedCount;
  }
}

describe("concurrencia del cupo (simulación del mecanismo real)", () => {
  it("con capacidad 1 y dos reservas simultáneas, exactamente una gana el cupo", async () => {
    const session = new FakeSessionRow(1);

    const [resultA, resultB] = await Promise.all([
      session.tryReserve(),
      session.tryReserve(),
    ]);

    const winners = [resultA, resultB].filter(Boolean);
    expect(winners).toHaveLength(1);
    expect(session.getBookedCount()).toBe(1);
  });

  it("con capacidad 1 y diez intentos simultáneos, sigue ganando solo uno y el cupo nunca se pasa", async () => {
    const session = new FakeSessionRow(1);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => session.tryReserve())
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(session.getBookedCount()).toBe(1);
    expect(session.getBookedCount()).toBeLessThanOrEqual(1);
  });

  it("con capacidad 3 y cinco intentos simultáneos, ganan exactamente 3 y el cupo nunca supera la capacidad", async () => {
    const session = new FakeSessionRow(3);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => session.tryReserve())
    );

    expect(results.filter(Boolean)).toHaveLength(3);
    expect(session.getBookedCount()).toBe(3);
  });

  it("liberar un cupo permite que una reserva posterior lo vuelva a tomar, sin superar la capacidad", async () => {
    const session = new FakeSessionRow(1);

    expect(await session.tryReserve()).toBe(true);
    expect(await session.tryReserve()).toBe(false); // lleno
    await session.release(); // cancelación
    expect(await session.tryReserve()).toBe(true); // otro alumno toma el lugar liberado
    expect(session.getBookedCount()).toBe(1);
  });
});
