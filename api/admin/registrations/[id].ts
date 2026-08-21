import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getRegistrationById,
  markInvitationSent,
  markRegistrationApproved,
  markRegistrationRejected,
} from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";
import { sendInvitationEmail } from "../../../server/lib/resend.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = Number(req.query.id);
  const { action } = (req.body ?? {}) as {
    action?: "approve" | "reject" | "resend";
  };

  if (
    !Number.isFinite(id) ||
    (action !== "approve" && action !== "reject" && action !== "resend")
  ) {
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
