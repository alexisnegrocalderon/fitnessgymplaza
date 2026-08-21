import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  countActiveRegistrations,
  createApprovedRegistration,
  findRegistrationByContact,
  EVENT_CAPACITY,
} from "../../server/db.js";
import { getValidAccessToken } from "../../server/lib/mercadopago.js";
import { sendInvitationEmail } from "../../server/lib/resend.js";
import {
  EVENT_PRICE_CLP,
  registrationSchema,
} from "../../shared/registration.js";

/**
 * Mercado Pago notifica cambios de estado (relevante sobre todo para medios
 * de pago que quedan `in_process`, ej. transferencias). Nunca se confía en
 * el body de la notificación: siempre se vuelve a consultar el pago contra
 * la API de Mercado Pago con el token del dueño antes de actuar.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = (req.body ?? {}) as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };
  const paymentId = body.data?.id;

  // Responder 200 igual a eventos que no son de pago (ej. merchant_order) —
  // Mercado Pago reintenta con backoff si no recibe 2xx.
  if (body.type !== "payment" || !paymentId) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  try {
    const accessToken = await getValidAccessToken();
    const mpConfig = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(mpConfig).get({ id: paymentId });

    if (payment.status !== "approved") {
      res.status(200).json({ ok: true, status: payment.status });
      return;
    }

    const email = payment.payer?.email;
    const externalReference = payment.external_reference ?? "";
    if (!email) {
      res.status(200).json({ ok: true, skipped: "no_payer_email" });
      return;
    }

    // Idempotencia: si ya existe una inscripción para este email (creada por
    // api/pay.ts en el camino síncrono, o por una notificación anterior),
    // no se crea una duplicada ni se manda un segundo correo.
    const already = await findRegistrationByContact(email, email);
    if (already) {
      res.status(200).json({ ok: true, alreadyRegistered: true });
      return;
    }

    const activeCount = await countActiveRegistrations();
    if (activeCount >= EVENT_CAPACITY) {
      res.status(200).json({ ok: true, skipped: "event_full" });
      return;
    }

    const fullName =
      [payment.payer?.first_name, payment.payer?.last_name]
        .filter(Boolean)
        .join(" ") || email;
    const whatsapp = externalReference || email;

    const parsed = registrationSchema.safeParse({
      fullName,
      email,
      whatsapp,
    });
    if (!parsed.success) {
      res.status(200).json({ ok: true, skipped: "invalid_payer_data" });
      return;
    }

    const row = await createApprovedRegistration({
      ...parsed.data,
      mpPaymentId: String(payment.id),
      amount: EVENT_PRICE_CLP,
    });

    await sendInvitationEmail(row.email, row.fullName);
    res.status(200).json({ ok: true, created: true });
  } catch (error) {
    console.error("[webhooks/mercadopago] failed", error);
    res.status(500).json({ error: "server_error" });
  }
}
