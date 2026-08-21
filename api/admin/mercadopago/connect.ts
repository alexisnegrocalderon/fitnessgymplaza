import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { serialize as serializeCookie } from "cookie";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";
import { getAuthorizeUrl } from "../../../server/lib/mercadopago.js";

export const STATE_COOKIE_NAME = "pf_mp_oauth_state";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const state = randomBytes(24).toString("hex");
  const stateCookie = serializeCookie(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax", // "strict" perdería la cookie en la vuelta desde auth.mercadopago.com
    path: "/",
    maxAge: 600, // 10 minutos alcanza para completar la autorización
  });

  try {
    const authorizeUrl = getAuthorizeUrl(state);
    res.setHeader("Set-Cookie", stateCookie);
    res.redirect(302, authorizeUrl);
  } catch (error) {
    console.error("[admin/mercadopago/connect] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
