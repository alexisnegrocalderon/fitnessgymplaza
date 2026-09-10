import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMemberById, getMemberPlanSummary } from "../../server/db.js";
import { getMemberIdFromRequest } from "../../server/lib/memberAuth.js";

/** Quién soy y cuál es mi plan vigente — lo primero que pide /app al
 * cargar, para decidir si muestra el login o el dashboard del alumno. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const memberId = await getMemberIdFromRequest(req.headers.cookie);
  if (!memberId) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }

  try {
    const member = await getMemberById(memberId);
    if (!member) {
      res.status(401).json({ error: "not_authenticated" });
      return;
    }
    const planSummary = await getMemberPlanSummary(memberId);
    res.status(200).json({
      member: {
        id: member.id,
        email: member.email,
        fullName: member.fullName,
        audience: member.audience,
        studentCertificateStatus: member.studentCertificateStatus,
      },
      plan: planSummary
        ? {
            tier: planSummary.membership.tier,
            creditsRemaining: planSummary.creditsRemaining,
            expiresAt: planSummary.membership.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error("[auth/me] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
