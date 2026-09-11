import type { VercelRequest, VercelResponse } from "@vercel/node";
import { consumeAuthToken, touchMemberLastSeen } from "../../server/db.js";
import { createMemberSessionCookie } from "../../server/lib/memberAuth.js";

/** Canjea el magic link: si el token es válido, no vencido y no usado,
 * arma la cookie de sesión y redirige a /app. Es un link que se clickea
 * desde el correo, así que responde con un redirect (GET), no con JSON. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const token = (req.query.token as string | undefined) ?? "";
  if (!token) {
    res.redirect(302, "/app/login?error=invalid_link");
    return;
  }

  try {
    const memberId = await consumeAuthToken(token);
    if (!memberId) {
      res.redirect(302, "/app/login?error=expired_link");
      return;
    }
    const cookie = await createMemberSessionCookie(memberId);
    await touchMemberLastSeen(memberId);
    res.setHeader("Set-Cookie", cookie);
    res.redirect(302, "/app");
  } catch (error) {
    console.error("[auth/verify] failed", error);
    res.redirect(302, "/app/login?error=server_error");
  }
}
