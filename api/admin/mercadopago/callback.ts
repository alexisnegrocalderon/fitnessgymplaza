import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import { exchangeCodeForConnection } from "../../../server/lib/mercadopago.js";
import { STATE_COOKIE_NAME } from "./connect.js";

/**
 * Mercado Pago redirige aquí con una navegación top-level cross-site, así
 * que la cookie de sesión de admin (SameSite=strict) NO viaja con este
 * request — no se puede usar isAdminRequest acá. La cookie `state`
 * (SameSite=lax, de un solo uso, emitida por /connect detrás del login de
 * admin) es la que prueba que fue el propio admin quien inició el flujo.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clearStateCookie = serializeCookie(STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const {
    code,
    state,
    error: mpError,
  } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (mpError) {
    res.setHeader("Set-Cookie", clearStateCookie);
    res.redirect(302, "/admin?mp=denied");
    return;
  }

  const cookieState = parseCookie(req.headers.cookie ?? "")[STATE_COOKIE_NAME];
  if (!code || !state || !cookieState || state !== cookieState) {
    res.setHeader("Set-Cookie", clearStateCookie);
    res.redirect(302, "/admin?mp=invalid_state");
    return;
  }

  try {
    await exchangeCodeForConnection(code);
    res.setHeader("Set-Cookie", clearStateCookie);
    res.redirect(302, "/admin?mp=connected");
  } catch (error) {
    console.error("[admin/mercadopago/callback] failed", error);
    res.setHeader("Set-Cookie", clearStateCookie);
    res.redirect(302, "/admin?mp=error");
  }
}
