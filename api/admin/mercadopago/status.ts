import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMpConnection } from "../../../server/db.js";
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
    const connection = await getMpConnection();
    if (!connection) {
      res.status(200).json({ connected: false });
      return;
    }
    res.status(200).json({
      connected: true,
      mpUserId: connection.mpUserId,
      liveMode: connection.liveMode,
      connectedAt: connection.connectedAt,
    });
  } catch (error) {
    console.error("[admin/mercadopago/status] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
