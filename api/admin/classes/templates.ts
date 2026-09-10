import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createClassTemplate,
  getEventSettings,
  listClassTemplates,
  seedDefaultClassTemplatesIfEmpty,
} from "../../../server/db.js";
import { isAdminRequest } from "../../../server/lib/adminAuth.js";

/** Plantillas de horario recurrentes ("lunes 08:30–09:30"). La primera vez
 * que se piden, si la tabla está vacía, se pueblan con el horario real que
 * ya está en shared/schedule.ts — así el admin ve de entrada lo que hoy
 * ofrece el gimnasio en vez de una pantalla en blanco. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const settings = await getEventSettings();
      await seedDefaultClassTemplatesIfEmpty(settings.defaultCapacity);
      const templates = await listClassTemplates();
      res.status(200).json({ templates });
    } catch (error) {
      console.error("[admin/classes/templates] list failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      weekday?: number;
      startTime?: string;
      endTime?: string;
      capacity?: number;
      coachId?: number | null;
    };
    if (
      typeof body.weekday !== "number" ||
      body.weekday < 0 ||
      body.weekday > 6 ||
      !body.startTime ||
      !body.endTime ||
      typeof body.capacity !== "number" ||
      body.capacity <= 0
    ) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const template = await createClassTemplate({
        weekday: body.weekday,
        startTime: body.startTime,
        endTime: body.endTime,
        capacity: body.capacity,
        coachId: body.coachId ?? null,
      });
      res.status(201).json({ template });
    } catch (error) {
      console.error("[admin/classes/templates] create failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
