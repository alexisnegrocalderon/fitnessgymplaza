import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAdminSessionCookie } from "../../server/lib/adminAuth";

/** Rate-limit muy simple, en memoria (basta para un panel de un solo admin). */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

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

  const { email, password } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    res.status(500).json({ error: "admin_not_configured" });
    return;
  }

  if (email !== adminEmail || password !== adminPassword) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const cookie = await createAdminSessionCookie();
  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
}
