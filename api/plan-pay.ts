import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  createApprovedPlanPurchase,
  findPlanPurchaseByContact,
  getEventSettings,
  markPlanPurchaseApprovedWithPayment,
} from "../server/db.js";
import { sendPlanConfirmationEmail } from "../server/lib/resend.js";
import {
  calculateApplicationFee,
  getValidAccessToken,
} from "../server/lib/mercadopago.js";
import { calculateServiceCharge } from "../shared/registration.js";
import { planPurchaseSchema } from "../shared/planPurchase.js";
import { findPlan, planPriceToNumber } from "../shared/plans.js";

/** El Payment Brick entrega este payload en su onSubmit — se reenvía casi
 * tal cual a la API de Mercado Pago, solo se fuerzan monto y descripción
 * desde el servidor para que el cliente nunca pueda alterar el precio. */
type BrickFormData = Record<string, unknown> & {
  payer?: Record<string, unknown>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown> & {
    formData?: BrickFormData;
  };

  const parsed = planPurchaseSchema.safeParse(body);
  if (!parsed.success || !body.formData) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const plan = findPlan(parsed.data.audience, parsed.data.tier);
  if (!plan) {
    res.status(400).json({ error: "invalid_plan" });
    return;
  }

  try {
    // El paso de contacto (api/plan-lead.ts) ya dejó a esta persona como
    // "pending" — acá se sube esa misma fila a "approved" en vez de
    // insertar una nueva. Solo se bloquea si ya había pagado antes.
    const existing = await findPlanPurchaseByContact(
      parsed.data.email,
      parsed.data.whatsapp
    );
    if (existing?.status === "approved") {
      res.status(200).json({ ok: true, alreadyPurchased: true });
      return;
    }

    const basePrice = planPriceToNumber(plan);
    const settings = await getEventSettings();
    const serviceCharge = calculateServiceCharge(
      basePrice,
      settings.serviceChargeBps
    );
    const totalAmount = basePrice + serviceCharge;

    const accessToken = await getValidAccessToken();
    const mpConfig = new MercadoPagoConfig({
      accessToken,
      options: { idempotencyKey: randomUUID() },
    });

    const paymentBody = {
      ...body.formData,
      // El cargo por servicio se cobra completo al cliente; la comisión de
      // marketplace (application_fee) se calcula solo sobre el valor del
      // plan, no sobre el total con cargo por servicio.
      transaction_amount: totalAmount,
      application_fee: calculateApplicationFee(basePrice),
      description: `Plan ${plan.label} — Plaza Fitness`,
      external_reference: `plan-${parsed.data.email}`,
      payer: {
        ...body.formData.payer,
        email: parsed.data.email,
      },
    } as unknown as Parameters<
      InstanceType<typeof Payment>["create"]
    >[0]["body"];

    const payment = await new Payment(mpConfig).create({ body: paymentBody });

    if (payment.status !== "approved") {
      res.status(200).json({
        ok: false,
        status: payment.status,
        statusDetail: payment.status_detail,
      });
      return;
    }

    const row = existing
      ? await markPlanPurchaseApprovedWithPayment(
          existing.id,
          String(payment.id),
          totalAmount
        )
      : await createApprovedPlanPurchase({
          fullName: parsed.data.fullName,
          rut: parsed.data.rut,
          whatsapp: parsed.data.whatsapp,
          email: parsed.data.email,
          audience: parsed.data.audience,
          tier: parsed.data.tier,
          planLabel: plan.label,
          mpPaymentId: String(payment.id),
          amount: totalAmount,
        });

    try {
      await sendPlanConfirmationEmail(
        row.email,
        row.fullName,
        row.planLabel,
        plan.price
      );
    } catch (emailError) {
      console.error("[plan-pay] confirmation email failed", emailError);
    }

    res.status(201).json({ ok: true, status: "approved" });
  } catch (error) {
    console.error("[plan-pay] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
