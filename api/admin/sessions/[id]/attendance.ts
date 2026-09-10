import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  closeSessionAttendance,
  setBookingAttendance,
} from "../../../../server/db.js";
import { isAdminRequest } from "../../../../server/lib/adminAuth.js";

/**
 * Pasa asistencia. Dos formas de uso desde el mismo endpoint:
 * - `{ bookingId, status: "attended" | "no_show" }` marca una reserva puntual.
 * - `{ action: "close" }` cierra la sesión: todo lo que seguía "booked" sin
 *   marcar pasa a "no_show" — el crédito ya se había descontado al reservar.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
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

  const body = (req.body ?? {}) as {
    action?: "close";
    bookingId?: number;
    status?: "attended" | "no_show";
  };

  try {
    if (body.action === "close") {
      const closed = await closeSessionAttendance(sessionId);
      res.status(200).json({ ok: true, closedAsNoShow: closed });
      return;
    }

    if (
      !Number.isInteger(body.bookingId) ||
      (body.status !== "attended" && body.status !== "no_show")
    ) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    const booking = await setBookingAttendance(
      body.bookingId as number,
      body.status
    );
    if (!booking) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(200).json({ ok: true, booking });
  } catch (error) {
    console.error("[admin/sessions/:id/attendance] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
