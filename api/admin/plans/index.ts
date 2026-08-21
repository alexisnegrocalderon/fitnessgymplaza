import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listPlanPurchases } from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const rows = await listPlanPurchases();
    res.status(200).json({ purchases: rows });
  } catch (error) {
    console.error("[admin/plans] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
