import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listBookingsForSession } from "../../../../server/db.js";
import { isAdminRequest } from "../../../../server/lib/adminAuth.js";

/** La lista de asistentes y lista de espera de una sesión, para pasar
 * asistencia o reservar/cancelar a nombre de un alumno desde el mostrador. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const sessionId = Number(req.query.id);
  if (!Number.isInteger(sessionId)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  try {
    const rows = await listBookingsForSession(sessionId);
    res.status(200).json({
      roster: rows.map(({ booking, member }) => ({
        bookingId: booking.id,
        status: booking.status,
        position: booking.position,
        member: {
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          whatsapp: member.whatsapp,
        },
      })),
    });
  } catch (error) {
    console.error("[admin/sessions/:id/roster] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
