import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EVENT_CAPACITY, countActiveRegistrations } from "../server/db";

/** Solo expone si el cupo está lleno — nunca el conteo real. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const count = await countActiveRegistrations();
    res.status(200).json({ full: count >= EVENT_CAPACITY });
  } catch (error) {
    console.error("[registration-status] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
