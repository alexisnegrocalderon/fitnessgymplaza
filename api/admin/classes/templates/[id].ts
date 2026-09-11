import type { VercelRequest, VercelResponse } from "@vercel/node";
import { updateClassTemplate } from "../../../../server/db.js";
import { isAdminRequest } from "../../../../server/lib/adminAuth.js";

/** Editar una plantilla: activar/desactivar, cambiar aforo o profesor.
 * No borra sesiones ya generadas — desactivar una plantilla solo evita
 * que se generen sesiones nuevas a partir de ella. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const body = (req.body ?? {}) as {
    active?: boolean;
    capacity?: number;
    coachId?: number | null;
    startTime?: string;
    endTime?: string;
  };

  try {
    const template = await updateClassTemplate(id, body);
    if (!template) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(200).json({ template });
  } catch (error) {
    console.error("[admin/classes/templates/:id] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
