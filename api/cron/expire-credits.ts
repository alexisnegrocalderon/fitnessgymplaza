import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runDailyMembershipMaintenance } from "../../server/db.js";

/**
 * Mantenimiento diario de membresías — pensado para un Vercel Cron Job
 * (vercel.json → "crons") una vez al día. Marca "expired" las membresías
 * vencidas y genera el ciclo siguiente de las que son parte de un pack de
 * 3/6 meses con recargas pendientes. Ver server/db.ts#runDailyMembershipMaintenance.
 *
 * Protegido con CRON_SECRET (header Authorization: Bearer <secreto>) —
 * mismo mecanismo que Vercel documenta para sus Cron Jobs, para que nadie
 * pueda disparar el mantenimiento desde afuera.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (secret && authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const result = await runDailyMembershipMaintenance();
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/expire-credits] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
