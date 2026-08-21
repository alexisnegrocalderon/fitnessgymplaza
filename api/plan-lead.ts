import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPlanPurchase, findPlanPurchaseByContact } from "../server/db.js";
import { planPurchaseSchema } from "../shared/planPurchase.js";
import { findPlan } from "../shared/plans.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const parsed = planPurchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "invalid_input", issues: parsed.error.issues });
    return;
  }

  const plan = findPlan(parsed.data.audience, parsed.data.tier);
  if (!plan) {
    res.status(400).json({ error: "invalid_plan" });
    return;
  }

  try {
    const existing = await findPlanPurchaseByContact(
      parsed.data.email,
      parsed.data.whatsapp
    );
    if (existing) {
      // Ya pagó: no se vuelve a registrar. Si sigue "pending" es un lead
      // que llenó el formulario antes pero no completó el pago — se deja
      // pasar sin duplicar fila, así retoma el pago desde donde quedó.
      if (existing.status === "approved") {
        res.status(200).json({ ok: true, alreadyPurchased: true });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    await createPlanPurchase({
      fullName: parsed.data.fullName,
      rut: parsed.data.rut,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      audience: parsed.data.audience,
      tier: parsed.data.tier,
      planLabel: plan.label,
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("[plan-lead] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
