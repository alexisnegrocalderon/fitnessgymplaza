import { serialize as serializeCookie, parse as parseCookie } from "cookie";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "pf_admin_session";
const SESSION_MS = 1000 * 60 * 60 * 12; // 12h — el admin vuelve a entrar cada media jornada.

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is required for the admin session");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionCookie(): Promise<string> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_MS) / 1000))
    .sign(getSecret());

  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export function clearAdminSessionCookie(): string {
  return serializeCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Reconfirmación de la clave del admin para acciones destructivas: la
 * cookie de sesión prueba "soy el admin", esto prueba "soy yo, ahora".
 * Mismo trim que el login, por los espacios de más al pegar el valor en
 * las variables de entorno. */
export function verifyAdminPassword(password: string | undefined): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!expected) return false;
  return (password ?? "").trim() === expected;
}

export async function isAdminRequest(
  cookieHeader: string | undefined
): Promise<boolean> {
  if (!cookieHeader) return false;
  const token = parseCookie(cookieHeader)[COOKIE_NAME];
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
