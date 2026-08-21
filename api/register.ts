import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  EVENT_CAPACITY,
  approveRegistration,
  countActiveRegistrations,
  createApprovedRegistration,
  findRegistrationByContact,
} from "../server/db.js";
import { sendInvitationEmail } from "../server/lib/resend.js";
import { registrationSchema } from "../shared/registration.js";

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
    const existing = await findRegistrationByContact(
      parsed.data.email,
      parsed.data.whatsapp
    );
    if (existing) {
      if (existing.status === "approved") {
        res.status(200).json({ ok: true, alreadyRegistered: true });
        return;
      }
      // Fila "pending" heredada de cuando la inscripción todavía cobraba —
      // se completa gratis ahora en vez de dejarla varada.
      const row = await approveRegistration(existing.id);
      try {
        await sendInvitationEmail(row.email, row.fullName);
      } catch (emailError) {
        console.error("[register] invitation email failed", emailError);
      }
      res.status(200).json({ ok: true });
      return;
    }

    const activeCount = await countActiveRegistrations();
    if (activeCount >= EVENT_CAPACITY) {
      res.status(409).json({ error: "event_full" });
      return;
    }

    const row = await createApprovedRegistration(parsed.data);
    try {
      await sendInvitationEmail(row.email, row.fullName);
    } catch (emailError) {
      console.error("[register] invitation email failed", emailError);
    }
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("[register] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
