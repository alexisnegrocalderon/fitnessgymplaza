import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEventSettings } from "../server/db.js";
import { calculateServiceCharge } from "../shared/registration.js";
import {
  findPlan,
  planPriceToNumber,
  type Audience,
  type PlanTier,
} from "../shared/plans.js";

/** Público — solo expone montos en pesos, nunca el porcentaje configurado. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const audience = req.query.audience as Audience | undefined;
  const tier = req.query.tier as PlanTier | undefined;

  const plan = audience && tier ? findPlan(audience, tier) : undefined;
  if (!plan) {
    res.status(400).json({ error: "invalid_plan" });
    return;
  }

  try {
    const settings = await getEventSettings();
    const basePrice = planPriceToNumber(plan);
    const serviceCharge = calculateServiceCharge(
      basePrice,
      settings.serviceChargeBps
    );
    res.status(200).json({
      basePrice,
      serviceCharge,
      total: basePrice + serviceCharge,
      planLabel: plan.label,
    });
  } catch (error) {
    console.error("[plan-pricing] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
