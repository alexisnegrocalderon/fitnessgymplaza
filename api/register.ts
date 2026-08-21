import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  EVENT_CAPACITY,
  approveRegistration,
  countActiveRegistrations,
  createApprovedRegistration,
  findRegistrationByEmail,
  markInvitationSent,
  updateRegistrationContact,
} from "../server/db.js";
import { sendInvitationEmail } from "../server/lib/resend.js";
import { registrationSchema } from "../shared/registration.js";

/** Ventana anti-rebote: si la invitación salió hace menos de esto, un
 * segundo envío del formulario no dispara otro correo (evita que alguien
 * bombardee la casilla de un tercero reenviando el form en loop). */
const RESEND_COOLDOWN_MS = 60_000;

/** Envía la invitación y sella invitationSentAt solo si el proveedor la
 * aceptó. Nunca lanza: una inscripción jamás se pierde por un fallo de
 * correo — se informa con emailSent: false y se puede reintentar. */
async function deliverInvitation(row: {
  id: number;
  email: string;
  fullName: string;
}): Promise<boolean> {
  try {
    await sendInvitationEmail(row.email, row.fullName);
    await markInvitationSent(row.id);
    return true;
  } catch (emailError) {
    console.error(
      `[register] invitation email failed for ${row.email}`,
      emailError
    );
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "invalid_input", issues: parsed.error.issues });
    return;
  }

  try {
    const existing = await findRegistrationByEmail(parsed.data.email);

    if (existing) {
      // Reinscripción con el mismo email: no se duplica la fila, pero sí se
      // guardan el nombre/WhatsApp más recientes y se reenvía la invitación
      // — que es justo lo que la persona vino a buscar si volvió al form.
      await updateRegistrationContact(existing.id, {
        fullName: parsed.data.fullName,
        whatsapp: parsed.data.whatsapp,
      });

      const row =
        existing.status === "approved"
          ? existing
          : await approveRegistration(existing.id);

      const sentAt = existing.invitationSentAt
        ? new Date(existing.invitationSentAt).getTime()
        : 0;
      const justSent = Date.now() - sentAt < RESEND_COOLDOWN_MS;

      const emailSent = justSent
        ? true
        : await deliverInvitation({
            id: row.id,
            email: row.email,
            fullName: parsed.data.fullName,
          });

      res.status(200).json({ ok: true, alreadyRegistered: true, emailSent });
      return;
    }

    const activeCount = await countActiveRegistrations();
    if (activeCount >= EVENT_CAPACITY) {
      res.status(409).json({ error: "event_full" });
      return;
    }

    const row = await createApprovedRegistration(parsed.data);
    const emailSent = await deliverInvitation(row);
    res.status(201).json({ ok: true, emailSent });
  } catch (error) {
    console.error("[register] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
