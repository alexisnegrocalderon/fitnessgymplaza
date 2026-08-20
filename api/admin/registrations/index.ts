import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listRegistrations } from "../../../server/db";
import { isAdminRequest } from "../../../server/lib/adminAuth";

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
    const rows = await listRegistrations();
    res.status(200).json({ registrations: rows });
  } catch (error) {
    console.error("[admin/registrations] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
