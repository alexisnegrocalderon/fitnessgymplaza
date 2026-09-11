import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  blockDateAndCancelSessions,
  deleteClosedDate,
  getMemberById,
  listClosedDates,
} from "../../server/db.js";
import { isAdminRequest } from "../../server/lib/adminAuth.js";
import { sendSessionCancelledEmail } from "../../server/lib/resend.js";
import { classLabelFor } from "../../shared/schedule.js";

/** Feriados y vacaciones. Bloquear una fecha cancela automáticamente
 * cualquier sesión ya generada para ese día y avisa a los afectados. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      res.status(200).json({ closedDates: await listClosedDates() });
    } catch (error) {
      console.error("[admin/closed-dates] list failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { date, reason } = (req.body ?? {}) as {
      date?: string;
      reason?: string;
    };
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "invalid_date" });
      return;
    }
    try {
      const { closedDate, results } = await blockDateAndCancelSessions(
        date,
        reason ?? ""
      );
      let notified = 0;
      for (const { session, affected } of results) {
        if (!session) continue;
        const label = classLabelFor(session.startsAt);
        for (const booking of affected) {
          try {
            const member = await getMemberById(booking.memberId);
            if (member) {
              await sendSessionCancelledEmail(
                member.email,
                member.fullName,
                label
              );
              notified += 1;
            }
          } catch (emailError) {
            console.error("[admin/closed-dates] email failed", emailError);
          }
        }
      }
      res.status(201).json({ closedDate, notified });
    } catch (error) {
      console.error("[admin/closed-dates] create failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const row = await deleteClosedDate(id);
      if (!row) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[admin/closed-dates] delete failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
