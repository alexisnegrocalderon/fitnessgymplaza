import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  cancelBooking,
  getEventSettings,
  getSessionById,
  listBookingsForSession,
  listCoaches,
} from "../../../server/db.js";
import { getMemberIdFromRequest } from "../../../server/lib/memberAuth.js";
import { sendWaitlistPromotedEmail } from "../../../server/lib/resend.js";
import { cancelRefundsCredit } from "../../../shared/booking.js";
import { classLabelFor } from "../../../shared/schedule.js";

/** Cancela la reserva del alumno logueado para esta sesión. El body debe
 * traer `bookingId` (la reserva es de quien la hizo — se valida en
 * server/db.ts#cancelBooking comparando memberId). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const memberId = await getMemberIdFromRequest(req.headers.cookie);
  if (!memberId) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }

  const sessionId = Number(req.query.id);
  const bookingId = Number((req.body ?? {}).bookingId);
  if (!Number.isInteger(sessionId) || !Number.isInteger(bookingId)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  try {
    const session = await getSessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const settings = await getEventSettings();
    const refundCredit = cancelRefundsCredit(
      { startsAt: session.startsAt },
      settings
    );

    const result = await cancelBooking(bookingId, memberId, refundCredit);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.promoted) {
      try {
        const roster = await listBookingsForSession(sessionId);
        const promotedRow = roster.find(
          r => r.booking.id === result.promoted!.id
        );
        const coaches = await listCoaches();
        if (promotedRow) {
          const coachName = coaches.find(c => c.id === session.coachId)?.name;
          await sendWaitlistPromotedEmail(
            promotedRow.member.email,
            promotedRow.member.fullName,
            classLabelFor(session.startsAt, coachName)
          );
        }
      } catch (emailError) {
        console.error(
          "[classes/cancel] waitlist promotion email failed",
          emailError
        );
      }
    }

    res.status(200).json({ ok: true, refundedCredit: refundCredit });
  } catch (error) {
    console.error("[classes/cancel] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
