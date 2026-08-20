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

  const body = (req.body ?? {}) as { email?: string; password?: string };
  // Trim en ambos lados: un espacio o salto de línea de más al pegar el
  // valor en Vercel (bulk .env import) es la causa más común de un
  // "credenciales incorrectas" que en verdad son idénticas a simple vista.
  // El email además es case-insensitive, como cualquier login normal.
  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

  if (!adminEmail || !adminPassword) {
    res.status(500).json({ error: "admin_not_configured" });
    return;
  }

  if (email !== adminEmail || password !== adminPassword) {
    res.status(401).json({
      error: "invalid_credentials",
      // Diagnóstico temporal, sin exponer los valores reales: solo dice
      // qué campo no coincide y si el largo es distinto (indicio típico
      // de un espacio de más). Se retira una vez resuelto.
      debug: {
        emailMatches: email === adminEmail,
        passwordMatches: password === adminPassword,
        emailLengthDiff: email.length - adminEmail.length,
        passwordLengthDiff: password.length - adminPassword.length,
      },
    });
    return;
  }

  const cookie = await createAdminSessionCookie();
  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
}
