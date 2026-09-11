import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEventSettings, updateGymSettings } from "../../server/db.js";
import { isAdminRequest } from "../../server/lib/adminAuth.js";

/** Topes razonables para evitar un error de tipeo. */
const LIMITS = {
  mpFeeRateBps: { min: 0, max: 3000 }, // hasta 30%
  defaultCapacity: { min: 1, max: 200 },
  bookingOpenDays: { min: 1, max: 90 },
  bookingCloseMinutes: { min: 0, max: 1440 },
  cancelWindowHours: { min: 0, max: 72 },
} as const;

type GymSettingsField = keyof typeof LIMITS;

function isValid(field: GymSettingsField, value: unknown): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  const { min, max } = LIMITS[field];
  return value >= min && value <= max;
}

/**
 * Reglas operativas del gimnasio, editables sin deploy: la tasa de
 * comisión de Mercado Pago asumida para el cargo por servicio con
 * "gross-up" (ver shared/registration.ts), el aforo por defecto de una
 * clase, y las ventanas de reserva/cancelación.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminRequest(req.headers.cookie))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const settings = await getEventSettings();
      res.status(200).json({
        mpFeeRateBps: settings.mpFeeRateBps,
        defaultCapacity: settings.defaultCapacity,
        bookingOpenDays: settings.bookingOpenDays,
        bookingCloseMinutes: settings.bookingCloseMinutes,
        cancelWindowHours: settings.cancelWindowHours,
      });
    } catch (error) {
      console.error("[admin/settings] get failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch: Partial<Record<GymSettingsField, number>> = {};

    for (const field of Object.keys(LIMITS) as GymSettingsField[]) {
      if (body[field] === undefined) continue;
      if (!isValid(field, body[field])) {
        res.status(400).json({ error: "invalid_input", field });
        return;
      }
      patch[field] = body[field] as number;
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    try {
      const row = await updateGymSettings(patch);
      res.status(200).json({
        mpFeeRateBps: row.mpFeeRateBps,
        defaultCapacity: row.defaultCapacity,
        bookingOpenDays: row.bookingOpenDays,
        bookingCloseMinutes: row.bookingCloseMinutes,
        cancelWindowHours: row.cancelWindowHours,
      });
    } catch (error) {
      console.error("[admin/settings] update failed", error);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
