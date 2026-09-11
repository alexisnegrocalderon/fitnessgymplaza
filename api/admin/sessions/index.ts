import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCoaches, listSessionsForDate } from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";
import { chileDateString } from "../../../shared/chileTime.js";

/** Vista del día: todas las sesiones de una fecha (?date=YYYY-MM-DD, hoy
 * por defecto), con cupo y nombre del profesor — la pantalla desde la que
 * el equipo pasa asistencia y gestiona el día a día. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const date = (req.query.date as string | undefined) ?? chileDateString();

  try {
    const [sessions, coaches] = await Promise.all([
      listSessionsForDate(date),
      listCoaches(),
    ]);
    const coachById = new Map(coaches.map(c => [c.id, c.name]));
    res.status(200).json({
      date,
      sessions: sessions.map(s => ({
        ...s,
        coachName: s.coachId ? (coachById.get(s.coachId) ?? null) : null,
      })),
    });
  } catch (error) {
    console.error("[admin/sessions] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
