import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createAuthTokenForMember,
  getMemberByEmail,
  touchMemberLastSeen,
} from "../../server/db.js";
import { sendMagicLinkEmail } from "../../server/lib/resend.js";
import { SITE_URL } from "../../shared/contact.js";

/** Rate-limit simple en memoria — mismo patrón que api/admin/login.ts. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Pide un magic link para entrar a /app. Responde siempre el mismo mensaje
 * genérico exista o no el email — decirle a quien pregunta "ese correo no
 * tiene cuenta" es un oráculo para enumerar alumnos, el mismo tipo de
 * problema que se corrigió en api/admin/login.ts.
 *
 * Solo los emails que YA son `members` (porque compraron un plan, o el
 * admin los dio de alta) reciben el enlace de verdad — pedir un link con
 * un correo cualquiera no crea una cuenta nueva.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ||
    "unknown";
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: "too_many_attempts" });
    return;
  }

  const body = (req.body ?? {}) as { email?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }

  try {
    const member = await getMemberByEmail(email);
    if (member) {
      const rawToken = await createAuthTokenForMember(member.id);
      const magicLinkUrl = `${SITE_URL}/api/auth/verify?token=${rawToken}`;
      await touchMemberLastSeen(member.id);
      try {
        await sendMagicLinkEmail(member.email, member.fullName, magicLinkUrl);
      } catch (emailError) {
        console.error("[auth/request-link] email failed", emailError);
      }
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[auth/request-link] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
