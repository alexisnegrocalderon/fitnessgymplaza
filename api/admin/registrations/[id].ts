import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  deleteRegistration,
  getRegistrationById,
  markInvitationSent,
  markRegistrationApproved,
  markRegistrationRejected,
} from "../../../server/db.js";
import {
  isAdminRequest,
  verifyAdminPassword,
} from "../../../server/lib/adminAuth.js";
import { sendInvitationEmail } from "../../../server/lib/resend.js";

/** Vercel entrega req.body ya parseado, pero en un DELETE con cuerpo hay
 * runtimes que lo dejan como string: normalizarlo evita que la
 * confirmación se pierda y el borrado parezca roto. */
function readBody(raw: unknown): { confirm?: boolean; password?: string } {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return (raw ?? {}) as { confirm?: boolean; password?: string };
}

/** Una inscripción "con valores asociados" es la que tiene plata detrás
 * (pago de Mercado Pago o monto registrado): borrarla destruye el
 * respaldo de una transacción, así que exige la clave del admin. */
function hasLinkedValue(row: {
  mpPaymentId: string | null;
  amount: number | null;
}) {
  return Boolean(row.mpPaymentId) || (row.amount ?? 0) > 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  if (req.method === "DELETE") {
    const { confirm, password } = readBody(req.body);
    // El "sí, estoy seguro" del panel viaja explícito: un DELETE suelto
    // contra la API nunca borra nada por accidente.
    if (confirm !== true) {
      res.status(400).json({ error: "confirmation_required" });
      return;
    }

    try {
      const registration = await getRegistrationById(id);
      if (!registration) {
        res.status(404).json({ error: "not_found" });
        return;
      }

      if (hasLinkedValue(registration) && !verifyAdminPassword(password)) {
        res.status(403).json({ error: "invalid_password" });
        return;
      }

      await deleteRegistration(id);
      res.status(200).json({ ok: true, deletedId: id });
    } catch (error) {
      console.error("[admin/registrations delete] failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  const { action } = (req.body ?? {}) as {
    action?: "approve" | "reject" | "resend";
  };

  if (action !== "approve" && action !== "reject" && action !== "resend") {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  try {
    const registration = await getRegistrationById(id);
    if (!registration) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    // Reenviar la invitación a alguien ya aprobado, sin cambiar su estado.
    if (action === "resend") {
      try {
        await sendInvitationEmail(registration.email, registration.fullName);
      } catch (emailError) {
        console.error("[admin/registrations resend] email failed", emailError);
        res.status(200).json({
          registration,
          emailFailed: true,
          message:
            emailError instanceof Error ? emailError.message : "unknown_error",
        });
        return;
      }
      const row = await markInvitationSent(id);
      res.status(200).json({ registration: row });
      return;
    }

    if (action === "reject") {
      const row = await markRegistrationRejected(id);
      res.status(200).json({ registration: row });
      return;
    }

    // Aprobar: marcar primero, enviar después. Si el email de Resend falla,
    // la inscripción queda aprobada igual — el admin reintenta con "resend"
    // sin volver a "aprobar" (evita doble email por reintento).
    const approvedRow = await markRegistrationApproved(id);
    try {
      await sendInvitationEmail(registration.email, registration.fullName);
    } catch (emailError) {
      console.error("[admin/registrations approve] email failed", emailError);
      res.status(200).json({
        registration: approvedRow,
        emailFailed: true,
        message:
          emailError instanceof Error ? emailError.message : "unknown_error",
      });
      return;
    }

    const row = await markInvitationSent(id);
    res.status(200).json({ registration: row });
  } catch (error) {
    console.error("[admin/registrations approve] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
