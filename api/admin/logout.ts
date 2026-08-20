import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearAdminSessionCookie } from "../../server/lib/adminAuth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  res.setHeader("Set-Cookie", clearAdminSessionCookie());
  res.status(200).json({ ok: true });
}
