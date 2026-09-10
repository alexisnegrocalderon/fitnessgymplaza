import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getEventSettings,
  listCoaches,
  listUpcomingSessionsForMember,
} from "../../server/db.js";
import { getMemberIdFromRequest } from "../../server/lib/memberAuth.js";
import { canBookSession } from "../../shared/booking.js";

/** Agenda del alumno: sesiones programadas de los próximos 30 días con su
 * disponibilidad, su propia reserva (si tiene una) y si todavía puede
 * reservar o cancelar según las reglas de ventana. */
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
    const settings = await getEventSettings();
    const [rows, coaches] = await Promise.all([
      listUpcomingSessionsForMember(memberId, settings.bookingOpenDays),
      listCoaches(),
    ]);
    const coachById = new Map(coaches.map(c => [c.id, c.name]));

    const sessions = rows.map(({ session, myBooking }) => {
      const eligibility = canBookSession(
        {
          date: session.date,
          startsAt: session.startsAt,
          status: session.status,
        },
        settings
      );
      return {
        id: session.id,
        date: session.date,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        capacity: session.capacity,
        bookedCount: session.bookedCount,
        spotsLeft: Math.max(session.capacity - session.bookedCount, 0),
        coachName: session.coachId
          ? (coachById.get(session.coachId) ?? null)
          : null,
        myBookingStatus: myBooking?.status ?? null,
        myBookingId: myBooking?.id ?? null,
        canBook: !myBooking && eligibility.ok,
        canBookReason: eligibility.ok ? null : eligibility.reason,
      };
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("[classes] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
