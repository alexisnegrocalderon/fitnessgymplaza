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

/** Cupos internos. Nunca se muestra al público, solo cierra el formulario. */
export const EVENT_CAPACITY = 100;
