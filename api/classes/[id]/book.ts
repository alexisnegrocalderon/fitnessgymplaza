import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  bookSession,
  getEventSettings,
  getMemberById,
  getSessionById,
  listCoaches,
} from "../../../server/db.js";
import { getMemberIdFromRequest } from "../../../server/lib/memberAuth.js";
import { sendBookingConfirmedEmail } from "../../../server/lib/resend.js";
import { canBookSession } from "../../../shared/booking.js";
import { classLabelFor } from "../../../shared/schedule.js";

const ERROR_MESSAGES: Record<string, string> = {
  no_credits: "No tienes créditos disponibles en tu plan.",
  already_booked_today: "Ya tienes una clase reservada ese día.",
  too_early: "Todavía no se abren los cupos para esta clase.",
  too_late: "Ya cerró la inscripción para esta clase.",
  session_cancelled: "Esta clase fue cancelada.",
};

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
  if (!Number.isInteger(sessionId)) {
    res.status(400).json({ error: "invalid_session" });
    return;
  }

  try {
    const session = await getSessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const settings = await getEventSettings();
    const eligibility = canBookSession(
      {
        date: session.date,
        startsAt: session.startsAt,
        status: session.status,
      },
      settings
    );
    if (!eligibility.ok) {
      res
        .status(400)
        .json({
          error: eligibility.reason,
          message: ERROR_MESSAGES[eligibility.reason],
        });
      return;
    }

    const result = await bookSession({
      memberId,
      sessionId,
      sessionDate: session.date,
    });
    if (!result.ok) {
      res
        .status(400)
        .json({ error: result.error, message: ERROR_MESSAGES[result.error] });
      return;
    }

    if (result.booking.status === "booked") {
      try {
        const [member, coaches] = await Promise.all([
          getMemberById(memberId),
          listCoaches(),
        ]);
        if (member) {
          const coachName = coaches.find(c => c.id === session.coachId)?.name;
          await sendBookingConfirmedEmail(
            member.email,
            member.fullName,
            classLabelFor(session.startsAt, coachName)
          );
        }
      } catch (emailError) {
        console.error("[classes/book] confirmation email failed", emailError);
      }
    }

    res.status(201).json({ ok: true, booking: result.booking });
  } catch (error) {
    console.error("[classes/book] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
