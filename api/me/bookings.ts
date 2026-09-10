import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listBookingHistoryForMember,
  listCoaches,
  listUpcomingBookingsForMember,
} from "../../server/db.js";
import { getMemberIdFromRequest } from "../../server/lib/memberAuth.js";

/** Próximas reservas e historial del alumno logueado — pantalla "Mis reservas". */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const memberId = await getMemberIdFromRequest(req.headers.cookie);
  if (!memberId) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }

  try {
    const [upcoming, history, coaches] = await Promise.all([
      listUpcomingBookingsForMember(memberId),
      listBookingHistoryForMember(memberId),
      listCoaches(),
    ]);
    const coachById = new Map(coaches.map(c => [c.id, c.name]));

    const shape = (rows: typeof upcoming) =>
      rows.map(({ booking, session }) => ({
        bookingId: booking.id,
        sessionId: session.id,
        status: booking.status,
        date: session.date,
        startsAt: session.startsAt,
        coachName: session.coachId
          ? (coachById.get(session.coachId) ?? null)
          : null,
      }));

    res.status(200).json({
      upcoming: shape(upcoming),
      history: shape(history),
    });
  } catch (error) {
    console.error("[me/bookings] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
