import { z } from "zod";

/** Validación compartida entre el formulario del cliente y /api/register. */
export const registrationSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa tu nombre completo").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un email válido")
    .max(320),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Ingresa un WhatsApp válido")
    .max(32)
    .regex(/^[\d+\s()-]+$/, "Solo números, +, espacios y guiones"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const EVENT_DETAILS = {
  name: "Gran Inauguración Plaza Fitness",
  date: "29 de agosto",
  time: "20:00 hrs",
  address: "Calle Quillota 656, Viña del Mar",
} as const;

/** Cargo por servicio en pesos, a partir de puntos base (1000 = 10.00%).
 * Reemplazada por calculateGrossUpServiceCharge para /planes — se deja acá
 * por si algún flujo futuro necesita un porcentaje plano simple. */
export function calculateServiceCharge(basePrice: number, bps: number): number {
  return Math.round((basePrice * bps) / 10000);
}

/** Comisión de marketplace que Mercado Pago acredita automáticamente a la
 * cuenta dueña de la aplicación en cada pago (ver
 * server/lib/mercadopago.ts:getValidAccessToken/calculateApplicationFee).
 * Vive acá, no en server/lib, porque el cálculo de "gross-up" de abajo
 * también la necesita y ese cálculo es público (api/plan-pricing.ts). */
export const APPLICATION_FEE_RATE = 0.015;

/**
 * Cargo por servicio con "gross-up": en vez de sumar un porcentaje plano
 * sobre el precio de lista, calcula cuánto hay que cobrarle de más al
 * alumno para que, después de que Mercado Pago se quede con su comisión
 * real y la plataforma con su 1,5%, a Plaza Fitness le llegue el 100% del
 * precio de lista.
 *
 *   T = P / (1 − mp − app)
 *   cargo = T − P
 *
 * `mpFeeRateBps` (puntos base) es una tasa ASUMIDA y configurable desde
 * /admin, no un valor medido: los cobros de Plaza Fitness han sido
 * presenciales hasta ahora, así que no hay historial real de liquidaciones
 * de Mercado Pago para calibrarla. Arranca en la tasa estándar publicada
 * por Mercado Pago Chile y se recalibra con datos reales una vez que
 * empiecen a entrar pagos online — ver el plan, §5.1, para el detalle
 * completo de esta advertencia.
 */
export function calculateGrossUpServiceCharge(
  basePrice: number,
  mpFeeRateBps: number
): number {
  const mp = mpFeeRateBps / 10000;
  const total = basePrice / (1 - mp - APPLICATION_FEE_RATE);
  return Math.round(total - basePrice);
}

/** Cupos internos. Nunca se muestra al público, solo cierra el formulario. */
export const EVENT_CAPACITY = 100;
