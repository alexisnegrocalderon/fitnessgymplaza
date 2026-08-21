import {
  getMpConnection,
  saveMpConnection,
  updateMpConnectionTokens,
} from "../db.js";

const OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const AUTHORIZE_URL = "https://auth.mercadopago.com/authorization";
const USERS_ME_URL = "https://api.mercadopago.com/users/me";

/** Refresca si faltan menos de 7 días para el vencimiento del access_token. */
const REFRESH_MARGIN_MS = 1000 * 60 * 60 * 24 * 7;

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
