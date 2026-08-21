import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  EVENT_CAPACITY,
  countActiveRegistrations,
  createApprovedRegistration,
  findRegistrationByContact,
  getEventSettings,
  markRegistrationApprovedWithPayment,
} from "../server/db.js";
import { sendInvitationEmail } from "../server/lib/resend.js";
import {
  calculateApplicationFee,
  getValidAccessToken,
} from "../server/lib/mercadopago.js";
import {
  EVENT_DETAILS,
  EVENT_PRICE_CLP,
  calculateServiceCharge,
  registrationSchema,
} from "../shared/registration.js";

/** El Payment Brick entrega este payload en su onSubmit — se reenvía casi
 * tal cual a la API de Mercado Pago, solo se fuerzan monto y descripción
 * desde el servidor para que el cliente nunca pueda alterar el precio. El
 * SDK del Brick no exporta un tipo compartido con el de creación de pagos
 * del SDK de servidor, así que se trata como forma opaca. */
type BrickFormData = Record<string, unknown> & {
  payer?: Record<string, unknown>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = (req.body ?? {}) as {
    fullName?: unknown;
    email?: unknown;
    whatsapp?: unknown;
    formData?: BrickFormData;
  };

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success || !body.formData) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  try {
    // El paso 1 (api/register.ts) ya dejó a esta persona como "pending" al
    // llenar el formulario — acá se sube esa misma fila a "approved" en vez
    // de insertar una nueva. Solo se bloquea si ya había pagado antes.
    const existing = await findRegistrationByContact(
      parsed.data.email,
      parsed.data.whatsapp
    );
    if (existing?.status === "approved") {
      res.status(200).json({ ok: true, alreadyRegistered: true });
      return;
    }

    if (!existing) {
      const activeCount = await countActiveRegistrations();
      if (activeCount >= EVENT_CAPACITY) {
        res.status(409).json({ error: "event_full" });
        return;
      }
    }

    const settings = await getEventSettings();
    const serviceCharge = calculateServiceCharge(
      EVENT_PRICE_CLP,
      settings.serviceChargeBps
    );
    const totalAmount = EVENT_PRICE_CLP + serviceCharge;

    const accessToken = await getValidAccessToken();
    const mpConfig = new MercadoPagoConfig({
      accessToken,
      options: { idempotencyKey: randomUUID() },
    });

    const paymentBody = {
      ...body.formData,
      // El cargo por servicio se cobra completo al cliente; la comisión de
      // marketplace (application_fee) se calcula solo sobre el valor de la
      // entrada, no sobre el total con cargo por servicio.
      transaction_amount: totalAmount,
      application_fee: calculateApplicationFee(EVENT_PRICE_CLP),
      description: EVENT_DETAILS.name,
      external_reference: `inauguracion-${parsed.data.email}`,
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
      ? await markRegistrationApprovedWithPayment(
          existing.id,
          String(payment.id),
          totalAmount
        )
      : await createApprovedRegistration({
          ...parsed.data,
          mpPaymentId: String(payment.id),
          amount: totalAmount,
        });

    try {
      await sendInvitationEmail(row.email, row.fullName);
    } catch (emailError) {
      console.error("[pay] invitation email failed", emailError);
    }

    res.status(201).json({ ok: true, status: "approved" });
  } catch (error) {
    console.error("[pay] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
