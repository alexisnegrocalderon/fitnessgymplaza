import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  adminAdjustCredits,
  adminSetMembershipExpiry,
} from "../../../../server/db.js";
import { isAdminRequest } from "../../../../server/lib/adminAuth.js";

/**
 * Ajustes manuales sobre una membresía del alumno — con motivo obligatorio,
 * que queda registrado en el ledger de créditos:
 * - `{ membershipId, creditsDelta, note }`: suma/resta créditos (ej. "le
 *   regalamos 2 clases", "cobro duplicado, se descuenta 1").
 * - `{ membershipId, expiresAt, note }`: mueve la fecha de vencimiento —
 *   caso de pausa por certificado médico, decidido caso a caso (sin regla
 *   automática de "días de pausa").
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

  const body = (req.body ?? {}) as {
    membershipId?: number;
    creditsDelta?: number;
    expiresAt?: string;
    note?: string;
  };
  const note = (body.note ?? "").trim();

  if (!Number.isInteger(body.membershipId) || !note) {
    res
      .status(400)
      .json({ error: "invalid_input", message: "El motivo es obligatorio." });
    return;
  }

  try {
    if (typeof body.creditsDelta === "number" && body.creditsDelta !== 0) {
      const membership = await adminAdjustCredits(
        body.membershipId as number,
        body.creditsDelta,
        note
      );
      if (!membership) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.status(200).json({ ok: true, membership });
      return;
    }

    if (body.expiresAt) {
      const newDate = new Date(body.expiresAt);
      if (Number.isNaN(newDate.getTime())) {
        res.status(400).json({ error: "invalid_date" });
        return;
      }
      const membership = await adminSetMembershipExpiry(
        body.membershipId as number,
        newDate,
        note
      );
      if (!membership) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.status(200).json({ ok: true, membership });
      return;
    }

    res.status(400).json({ error: "invalid_input" });
  } catch (error) {
    console.error("[admin/members/:id/credits] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
