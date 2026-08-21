import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEventSettings, updateServiceChargeBps } from "../../server/db.js";
import { isAdminRequest } from "../../server/lib/adminAuth.js";

/** Tope razonable para evitar un error de tipeo (ej. "1000" en vez de "10"). */
const MAX_SERVICE_CHARGE_BPS = 5000; // 50%

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const settings = await getEventSettings();
      res.status(200).json({ serviceChargeBps: settings.serviceChargeBps });
    } catch (error) {
      console.error("[admin/settings] get failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { serviceChargeBps } = (req.body ?? {}) as {
      serviceChargeBps?: unknown;
    };
    if (
      typeof serviceChargeBps !== "number" ||
      !Number.isInteger(serviceChargeBps) ||
      serviceChargeBps < 0 ||
      serviceChargeBps > MAX_SERVICE_CHARGE_BPS
    ) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const row = await updateServiceChargeBps(serviceChargeBps);
      res.status(200).json({ serviceChargeBps: row.serviceChargeBps });
    } catch (error) {
      console.error("[admin/settings] update failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
