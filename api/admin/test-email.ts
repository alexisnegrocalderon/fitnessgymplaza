import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { isAdminRequest } from "../../server/lib/adminAuth.js";
import {
  sendInvitationEmail,
  sendPlanConfirmationEmail,
} from "../../server/lib/resend.js";
import { findPlan, planPriceToNumber } from "../../shared/plans.js";
import { formatCLP } from "../../shared/format.js";

const bodySchema = z.object({
  to: z.string().trim().toLowerCase().email(),
  template: z.enum(["invitation", "plan"]),
});

/** Envía un mail de muestra con datos de ejemplo — para que el admin
 * confirme cómo llega de verdad a una bandeja real, sin depender de una
 * inscripción/compra real. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  try {
    const { to, template } = parsed.data;
    if (template === "invitation") {
      await sendInvitationEmail(to, "Nombre Apellido");
    } else {
      const plan = findPlan("general", "twelve");
      const price = plan ? formatCLP(planPriceToNumber(plan)) : "$60.000";
      await sendPlanConfirmationEmail(
        to,
        "Nombre Apellido",
        "12 clases",
        price
      );
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[admin/test-email] failed", error);
    res.status(500).json({
      error: "send_failed",
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
