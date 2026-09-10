import type { PlanTier } from "./plans";

/**
 * Cuántos créditos entrega cada tier y cada cuántos días se recargan.
 *
 * Los packs de 3 y 6 meses no entregan 36/72 créditos de una vez: recargan
 * 12 créditos cada 30 días (como una mensualidad de 12 clases pagada por
 * adelantado), y los créditos no usados en un ciclo NO pasan al siguiente.
 * `renewals` es cuántas recargas automáticas le quedan después de la
 * primera (que ya viene incluida al comprar): pack3 = 2 recargas más
 * (meses 2 y 3), pack6 = 5 recargas más (meses 2 al 6).
 */
export const MEMBERSHIP_DURATION_DAYS = 30;

type CreditPlan = { creditsPerCycle: number; renewals: number };

export const CREDITS_BY_TIER: Record<PlanTier, CreditPlan> = {
  single: { creditsPerCycle: 1, renewals: 0 },
  eight: { creditsPerCycle: 8, renewals: 0 },
  twelve: { creditsPerCycle: 12, renewals: 0 },
  pack3: { creditsPerCycle: 12, renewals: 2 },
  pack6: { creditsPerCycle: 12, renewals: 5 },
};

export function creditsForTier(tier: PlanTier): number {
  return CREDITS_BY_TIER[tier].creditsPerCycle;
}

export function renewalsForTier(tier: PlanTier): number {
  return CREDITS_BY_TIER[tier].renewals;
}

/** Fecha de vencimiento de un ciclo de membresía, a partir de cuándo empieza. */
export function membershipExpiryFrom(startsAt: Date): Date {
  return new Date(
    startsAt.getTime() + MEMBERSHIP_DURATION_DAYS * 24 * 60 * 60 * 1000
  );
}
