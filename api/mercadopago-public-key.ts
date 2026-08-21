import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMpConnection } from "../server/db.js";

/** Público por diseño — la Public Key de Mercado Pago está pensada para
 * usarse en el cliente (inicializar el Brick). */
export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const connection = await getMpConnection();
    if (!connection) {
      res.status(503).json({ error: "mp_not_connected" });
      return;
    }
    res.status(200).json({ publicKey: connection.publicKey });
  } catch (error) {
    console.error("[mercadopago-public-key] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
