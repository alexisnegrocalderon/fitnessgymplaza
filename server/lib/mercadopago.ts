import { createHmac, timingSafeEqual } from "node:crypto";
import {
  getMpConnection,
  saveMpConnection,
  updateMpConnectionTokens,
} from "../db.js";
import { APPLICATION_FEE_RATE } from "../../shared/registration.js";

const OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const AUTHORIZE_URL = "https://auth.mercadopago.com/authorization";
const USERS_ME_URL = "https://api.mercadopago.com/users/me";

/** Refresca si faltan menos de 7 días para el vencimiento del access_token. */
const REFRESH_MARGIN_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * Comisión de marketplace: se descuenta de cada pago y se acredita
 * automáticamente a la cuenta dueña de la aplicación (Client ID/Secret,
 * cuenta ANC) — no a la cuenta conectada (Plaza Fitness). Requiere que el
 * pago se cree con el access_token del vendedor conectado por OAuth, que
 * es justamente lo que hace getValidAccessToken(). La tasa
 * (APPLICATION_FEE_RATE) vive en shared/registration.ts porque el cálculo
 * de "gross-up" del cargo por servicio también la necesita.
 */

/** Monto de comisión en la misma unidad que `amount` (CLP, sin decimales). */
export function calculateApplicationFee(amount: number): number {
  return Math.round(amount * APPLICATION_FEE_RATE);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Mercado Pago OAuth`);
  return value;
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("MP_CLIENT_ID"),
    response_type: "code",
    platform_id: "mp",
    redirect_uri: requireEnv("MP_REDIRECT_URI"),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type OAuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  user_id: number;
  live_mode: boolean;
  expires_in: number;
};

async function fetchPublicKey(accessToken: string): Promise<string> {
  const res = await fetch(USERS_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago users/me failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    live_mode?: boolean;
    public_key?: string;
  };
  if (!data.public_key) {
    throw new Error("Mercado Pago users/me returned no public_key");
  }
  return data.public_key;
}

/** Canjea el `code` del callback OAuth por tokens y guarda la conexión. */
export async function exchangeCodeForConnection(code: string) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("MP_CLIENT_ID"),
      client_secret: requireEnv("MP_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: requireEnv("MP_REDIRECT_URI"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago oauth/token failed: ${res.status}`);
  }
  const data = (await res.json()) as OAuthTokenResponse;
  const publicKey = await fetchPublicKey(data.access_token);

  return saveMpConnection({
    mpUserId: String(data.user_id),
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    publicKey,
    liveMode: data.live_mode,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  });
}

async function refreshConnection(
  id: number,
  refreshToken: string
): Promise<string> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("MP_CLIENT_ID"),
      client_secret: requireEnv("MP_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago token refresh failed: ${res.status}`);
  }
  const data = (await res.json()) as OAuthTokenResponse;
  await updateMpConnectionTokens(id, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  });
  return data.access_token;
}

/** Token vigente del dueño para crear pagos — lo renueva si está por vencer. */
export async function getValidAccessToken(): Promise<string> {
  const connection = await getMpConnection();
  if (!connection) {
    throw new Error("mp_not_connected");
  }
  const expiresInMs = connection.expiresAt.getTime() - Date.now();
  if (expiresInMs < REFRESH_MARGIN_MS) {
    return refreshConnection(connection.id, connection.refreshToken);
  }
  return connection.accessToken;
}

/**
 * Valida la firma `x-signature` de una notificación webhook de Mercado
 * Pago, siguiendo el algoritmo oficial: se arma un "manifest" con el id del
 * recurso (tal como llega en el query string), el `x-request-id` y el
 * timestamp, y se compara su HMAC-SHA256 (con el secreto del webhook)
 * contra el valor `v1` que Mercado Pago envía en el header.
 *
 * Sin esto, cualquiera podría llamar al endpoint del webhook con un
 * `data.id` inventado y forzar que se revise (y potencialmente apruebe)
 * una compra ajena — por eso se exige `MP_WEBHOOK_SECRET` configurado.
 *
 * @see https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyWebhookSignature(params: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataIdFromQuery: string | undefined;
}): boolean {
  const { xSignature, xRequestId, dataIdFromQuery } = params;
  if (!xSignature || !xRequestId || !dataIdFromQuery) return false;

  const parts = new Map<string, string>();
  for (const piece of xSignature.split(",")) {
    const [key, value] = piece.split("=").map(s => s?.trim());
    if (key && value) parts.set(key, value);
  }
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;

  // Mercado Pago indica que si el id trae letras hay que pasarlas a
  // minúscula antes de armar el manifest.
  const dataId = dataIdFromQuery.toLowerCase();
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const secret = requireEnv("MP_WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
