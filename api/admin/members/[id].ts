import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getMemberById,
  listBookingHistoryForMember,
  listCreditLedgerForMembership,
  listMembershipsForMember,
  setMemberCertificateStatus,
} from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";

/** Ficha del alumno: sus membresías (con el ledger de cada una) y su
 * historial de reservas — la vista de detalle en la pestaña Alumnos. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  if (req.method === "GET") {
    try {
      const member = await getMemberById(id);
      if (!member) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      const memberships = await listMembershipsForMember(id);
      const membershipsWithLedger = await Promise.all(
        memberships.map(async m => ({
          ...m,
          ledger: await listCreditLedgerForMembership(m.id),
        }))
      );
      const bookings = await listBookingHistoryForMember(id);
      res
        .status(200)
        .json({ member, memberships: membershipsWithLedger, bookings });
    } catch (error) {
      console.error("[admin/members/:id] get failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const { studentCertificateStatus } = (req.body ?? {}) as {
      studentCertificateStatus?:
        | "not_applicable"
        | "pending_verification"
        | "verified";
    };
    if (!studentCertificateStatus) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const member = await setMemberCertificateStatus(
        id,
        studentCertificateStatus
      );
      if (!member) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.status(200).json({ member });
    } catch (error) {
      console.error("[admin/members/:id] patch failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
