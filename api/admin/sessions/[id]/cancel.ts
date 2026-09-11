import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  cancelClassSession,
  getMemberById,
  listCoaches,
} from "../../../../server/db.js";
import { isAdminRequest } from "../../../../server/lib/adminAuth.js";
import { sendSessionCancelledEmail } from "../../../../server/lib/resend.js";
import { classLabelFor } from "../../../../shared/schedule.js";

/** Cancela una clase completa — devuelve el crédito a todos los que tenían
 * cupo confirmado y avisa por email a todos los afectados (booked y
 * waitlisted). */
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

  try {
    const { session, affected } = await cancelClassSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const coaches = await listCoaches();
    const coachName = coaches.find(c => c.id === session.coachId)?.name;
    const label = classLabelFor(session.startsAt, coachName);

    for (const booking of affected) {
      try {
        const member = await getMemberById(booking.memberId);
        if (member)
          await sendSessionCancelledEmail(member.email, member.fullName, label);
      } catch (emailError) {
        console.error("[admin/sessions/:id/cancel] email failed", emailError);
      }
    }

    res.status(200).json({ ok: true, affected: affected.length });
  } catch (error) {
    console.error("[admin/sessions/:id/cancel] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
