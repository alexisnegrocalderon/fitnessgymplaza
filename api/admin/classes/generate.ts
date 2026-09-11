import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateClassSessions } from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";
import { chileDateString } from "../../../shared/chileTime.js";

const MAX_WEEKS = 12;

/** Genera las sesiones concretas de las próximas N semanas a partir de una
 * plantilla — es idempotente (correrlo dos veces no duplica sesiones), así
 * que el admin puede apretar el botón sin miedo a romper nada. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const body = (req.body ?? {}) as { weeks?: number; fromDate?: string };
  const weeks = Number.isInteger(body.weeks) ? (body.weeks as number) : 4;
  if (weeks <= 0 || weeks > MAX_WEEKS) {
    res
      .status(400)
      .json({
        error: "invalid_weeks",
        message: `weeks debe estar entre 1 y ${MAX_WEEKS}`,
      });
    return;
  }
  const fromDate = body.fromDate ?? chileDateString();

  try {
    const created = await generateClassSessions(fromDate, weeks);
    res.status(200).json({ ok: true, created });
  } catch (error) {
    console.error("[admin/classes/generate] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
