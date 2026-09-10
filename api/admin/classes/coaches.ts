import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCoach, listCoaches, updateCoach } from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      res.status(200).json({ coaches: await listCoaches() });
    } catch (error) {
      console.error("[admin/classes/coaches] list failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { name } = (req.body ?? {}) as { name?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const coach = await createCoach({ name: name.trim() });
      res.status(201).json({ coach });
    } catch (error) {
      console.error("[admin/classes/coaches] create failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const { id, active, name } = (req.body ?? {}) as {
      id?: number;
      active?: boolean;
      name?: string;
    };
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const coach = await updateCoach(id as number, { active, name });
      res.status(200).json({ coach });
    } catch (error) {
      console.error("[admin/classes/coaches] update failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
