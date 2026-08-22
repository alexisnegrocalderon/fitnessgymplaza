import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deletePlanPurchase, getPlanPurchaseById } from "../../../server/db.js";
import {
  isAdminRequest,
  verifyAdminPassword,
} from "../../../server/lib/adminAuth.js";

/** Vercel entrega req.body ya parseado, pero en un DELETE con cuerpo hay
 * runtimes que lo dejan como string: normalizarlo evita que la
 * confirmación se pierda y el borrado parezca roto. */
function readBody(raw: unknown): { confirm?: boolean; password?: string } {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return (raw ?? {}) as { confirm?: boolean; password?: string };
}

/** Borrado de una compra de plan. A diferencia de una inscripción, aquí
 * siempre hay dinero de por medio, así que la clave del admin no es
 * opcional: es el registro de una transacción el que se destruye. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const { confirm, password } = readBody(req.body);
  if (confirm !== true) {
    res.status(400).json({ error: "confirmation_required" });
    return;
  }

  if (!verifyAdminPassword(password)) {
    res.status(403).json({ error: "invalid_password" });
    return;
  }

  try {
    const purchase = await getPlanPurchaseById(id);
    if (!purchase) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    await deletePlanPurchase(id);
    res.status(200).json({ ok: true, deletedId: id });
  } catch (error) {
    console.error("[admin/plans delete] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
