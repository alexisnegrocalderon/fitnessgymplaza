import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEventSettings } from "../server/db.js";
import {
  EVENT_PRICE_CLP,
  calculateServiceCharge,
} from "../shared/registration.js";

/** Público — solo expone montos en pesos, nunca el porcentaje configurado. */
export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const settings = await getEventSettings();
    const serviceCharge = calculateServiceCharge(
      EVENT_PRICE_CLP,
      settings.serviceChargeBps
    );
    res.status(200).json({
      basePrice: EVENT_PRICE_CLP,
      serviceCharge,
      total: EVENT_PRICE_CLP + serviceCharge,
    });
  } catch (error) {
    console.error("[event-pricing] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
