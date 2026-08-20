import type { Transition } from "framer-motion";

/**
 * Sistema de movimiento de Plaza Fitness.
 *
 * Apple describe sus resortes con dos parámetros de diseño: damping ratio
 * (cuánto rebota) y response (qué tan rápido llega). Framer Motion expone
 * `bounce` + `duration`, que mapea casi 1:1 con `bounce ≈ 1 - damping`.
 *
 * Regla: ninguna sección debe escribir su propio `duration`/`ease` a mano.
 */
export const spring = {
  /** Críticamente amortiguado. El default de todo lo que no nace de un gesto. */
  ui: { type: "spring", bounce: 0, duration: 0.4 },
  /** Asentado más lento para superficies grandes que entran al viewport. */
  reveal: { type: "spring", bounce: 0, duration: 0.7 },
  /** Solo para momentum real: un flick, un lanzamiento, soltar un arrastre. */
  momentum: { type: "spring", bounce: 0.18, duration: 0.45 },
  /** Feedback de presión. Tiene que sentirse instantáneo. */
  press: { type: "spring", bounce: 0, duration: 0.18 },
  /** Hojas y modales: Apple usa damping ~0.8 / response 0.3. */
  sheet: { type: "spring", bounce: 0.2, duration: 0.3 },
} satisfies Record<string, Transition>;

/** Equivalente con movimiento reducido: cross-fade, sin viaje ni rebote. */
export const calm: Transition = { duration: 0.2, ease: "easeOut" };

/**
 * Proyección de momentum de Apple (código de ejemplo de "Designing Fluid
 * Interfaces"). NO es la fórmula de manual v²/2a: es decaimiento exponencial,
 * y es lo que hace que un flick se sienta como un lanzamiento real.
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Resistencia progresiva más allá de un borde: resistir, nunca frenar en seco. */
export function rubberband(overshoot: number, dimension: number, c = 0.55) {
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}

/** Punto de anclaje más cercano a un destino proyectado. */
export function nearestSnap(projected: number, snapPoints: number[]) {
  return snapPoints.reduce((best, point) =>
    Math.abs(point - projected) < Math.abs(best - projected) ? point : best
  );
}

/** Un toque háptico corto, solo donde el dispositivo lo soporta. */
export function tick(duration = 8) {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(duration);
  }
}
