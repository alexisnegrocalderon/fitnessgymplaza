import { serialize as serializeCookie, parse as parseCookie } from "cookie";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "pf_member_session";
// Sesión larga a propósito: el alumno entra por magic link, no por
// contraseña — que tenga que repetir ese trámite cada 12h (como el admin)
// sería fricción sin ningún beneficio de seguridad real acá.
const SESSION_MS = 1000 * 60 * 60 * 24 * 75; // ~75 días

function getSecret() {
  // Secreto DISTINTO al del admin (ADMIN_JWT_SECRET) — nunca reutilizar:
  // una sesión de alumno nunca debe poder verificarse como si fuera una
  // sesión de admin ni viceversa, aunque compartieran el mismo algoritmo.
  const secret = process.env.MEMBER_JWT_SECRET;
  if (!secret) {
    throw new Error("MEMBER_JWT_SECRET is required for the member session");
  }
  return new TextEncoder().encode(secret);
}

export async function createMemberSessionCookie(
  memberId: number
): Promise<string> {
  const token = await new SignJWT({ memberId })
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

export function clearMemberSessionCookie(): string {
  return serializeCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Devuelve el memberId de la sesión vigente, o undefined si no hay
 * cookie, está vencida o es inválida. */
export async function getMemberIdFromRequest(
  cookieHeader: string | undefined
): Promise<number | undefined> {
  if (!cookieHeader) return undefined;
  const token = parseCookie(cookieHeader)[COOKIE_NAME];
  if (!token) return undefined;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.memberId === "number" ? payload.memberId : undefined;
  } catch {
    return undefined;
  }
}
