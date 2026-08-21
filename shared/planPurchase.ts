import { z } from "zod";
import { isValidRut } from "./rut.js";

/** Validación compartida entre /planes y sus endpoints. */
export const planPurchaseSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa tu nombre completo").max(200),
  rut: z
    .string()
    .trim()
    .refine(
      isValidRut,
      "RUT inválido — revisa el número y el dígito verificador"
    ),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Ingresa un WhatsApp válido")
    .max(32)
    .regex(/^[\d+\s()-]+$/, "Solo números, +, espacios y guiones"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un email válido")
    .max(320),
  audience: z.enum(["general", "student"]),
  tier: z.enum(["single", "eight", "twelve"]),
});

export type PlanPurchaseInput = z.infer<typeof planPurchaseSchema>;
