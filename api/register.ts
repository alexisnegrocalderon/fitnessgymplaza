import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  EVENT_CAPACITY,
  countActiveRegistrations,
  createRegistration,
  findRegistrationByContact,
} from "../server/db.js";
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
      // Ya pagó: no se vuelve a registrar. Si sigue "pending" es un lead
      // que llenó el formulario antes pero no completó el pago — se deja
      // pasar sin duplicar fila, así retoma el pago desde donde quedó.
      if (existing.status === "approved") {
        res.status(200).json({ ok: true, alreadyRegistered: true });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    const activeCount = await countActiveRegistrations();
    if (activeCount >= EVENT_CAPACITY) {
      res.status(409).json({ error: "event_full" });
      return;
    }

    await createRegistration(parsed.data);
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("[register] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
