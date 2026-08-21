/**
 * Catálogo de planes del gimnasio — vive en shared/ (no en client/) porque
 * lo necesitan tanto el cliente (mostrar precios) como el servidor
 * (api/plan-lead.ts, api/plan-pay.ts resuelven el precio real acá, nunca
 * confían en lo que mande el navegador).
 */

export type Audience = "general" | "student";
export type PlanTier = "single" | "eight" | "twelve";

export type Plan = {
  id: string;
  audience: Audience;
  tier: PlanTier;
  label: string;
  price: string;
  tagline: string;
  note: string;
  cadence: string;
  featured?: boolean;
  studentRequirement?: boolean;
};

export const plans: Plan[] = [
  {
    id: "general-single",
    audience: "general",
    tier: "single",
    label: "Pase diario",
    price: "$8.000",
    tagline: "Conoce el circuito",
    note: "Una sesión para probar el ritmo, la guía técnica y el formato de Plaza Fitness.",
    cadence: "Ideal para una primera experiencia.",
  },
  {
    id: "general-8",
    audience: "general",
    tier: "eight",
    label: "8 clases",
    price: "$45.000",
    tagline: "Construye constancia",
    note: "Un formato pensado para convertir el entrenamiento en una práctica semanal sostenible.",
    cadence: "Frecuencia sugerida: 2 veces por semana.",
  },
  {
    id: "general-12",
    audience: "general",
    tier: "twelve",
    label: "12 clases",
    price: "$60.000",
    tagline: "Más pulso, más progreso",
    note: "Mayor presencia en la semana para profundizar técnica, capacidad y consistencia.",
    cadence: "Frecuencia sugerida: 3 veces por semana.",
    featured: true,
  },
  {
    id: "student-single",
    audience: "student",
    tier: "single",
    label: "Pase diario",
    price: "$6.000",
    tagline: "Acceso estudiante",
    note: "Una sesión con tarifa estudiante para conocer la dinámica del gimnasio.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
  {
    id: "student-8",
    audience: "student",
    tier: "eight",
    label: "8 clases",
    price: "$36.000",
    tagline: "Ritmo estudiante",
    note: "Una alternativa diseñada para sostener movimiento, estudio y bienestar en paralelo.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
  {
    id: "student-12",
    audience: "student",
    tier: "twelve",
    label: "12 clases",
    price: "$46.000",
    tagline: "Sostén el hábito",
    note: "Más presencia para acompañar tu condición física durante el semestre.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
];

export function findPlan(audience: Audience, tier: PlanTier): Plan | undefined {
  return plans.find(plan => plan.audience === audience && plan.tier === tier);
}

/** "$45.000" -> 45000 */
export function planPriceToNumber(plan: Plan): number {
  return Number(plan.price.replace(/[^\d]/g, ""));
}
