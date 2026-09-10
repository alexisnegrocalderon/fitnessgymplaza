import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  findPendingPlanPurchaseByEmail,
  getPlanPurchaseByMpPaymentId,
  markPlanPurchaseApprovedWithPayment,
  markPlanPurchaseRejected,
} from "../../server/db.js";
import {
  getValidAccessToken,
  verifyWebhookSignature,
} from "../../server/lib/mercadopago.js";
import { sendPlanConfirmationEmail } from "../../server/lib/resend.js";
import { findPlan } from "../../shared/plans.js";

/**
 * Webhook de Mercado Pago para /planes.
 *
 * `api/plan-pay.ts` solo sube una compra a "approved" cuando la respuesta
 * síncrona de `Payment.create` viene con `status === "approved"` — un pago
 * que se aprueba después (efectivo, algunos medios de débito, revisión
 * antifraude) queda en "pending" para siempre y el alumno nunca recibe su
 * confirmación. Este endpoint cierra ese agujero: Mercado Pago llama acá
 * cada vez que un pago cambia de estado, y este handler re-consulta el pago
 * directamente en la API de Mercado Pago (nunca confía en el body de la
 * notificación) y actualiza la compra correspondiente.
 *
 * Configurar en el panel de Mercado Pago (Tus integraciones → Webhooks):
 * URL = https://plazafitness.cl/api/mercadopago/webhook, evento "Pagos".
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const query = req.query as Record<string, string | string[] | undefined>;
  const body = (req.body ?? {}) as { type?: string; data?: { id?: string } };

  const type = (query.type as string | undefined) ?? body.type;
  const dataIdRaw = (query["data.id"] as string | undefined) ?? body.data?.id;
  const dataId = Array.isArray(dataIdRaw) ? dataIdRaw[0] : dataIdRaw;

  if (type !== "payment" || !dataId) {
    // Mercado Pago también notifica otros tipos de evento (merchant_order,
    // etc.) que no nos interesan — se confirma la recepción igual para que
    // no siga reintentando algo que nunca vamos a procesar.
    res.status(200).json({ ignored: true });
    return;
  }

  let signatureOk: boolean;
  try {
    signatureOk = verifyWebhookSignature({
      xSignature: req.headers["x-signature"] as string | undefined,
      xRequestId: req.headers["x-request-id"] as string | undefined,
      dataIdFromQuery: dataId,
    });
  } catch (error) {
    // Falta MP_WEBHOOK_SECRET en el entorno — no es que la firma esté mal,
    // es que no configuramos el endpoint. Debe verse como un error de
    // configuración, no como un intento de suplantación.
    console.error("[mercadopago-webhook] misconfigured", error);
    res.status(500).json({ error: "webhook_not_configured" });
    return;
  }
  if (!signatureOk) {
    console.error("[mercadopago-webhook] invalid signature", { dataId });
    res.status(401).json({ error: "invalid_signature" });
    return;
  }

  try {
    const accessToken = await getValidAccessToken();
    const mpConfig = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(mpConfig).get({ id: dataId });

    // Idempotencia: si ya procesamos este mismo pago (Mercado Pago reenvía
    // notificaciones), no hay nada más que hacer.
    const alreadyRecorded = await getPlanPurchaseByMpPaymentId(
      String(payment.id)
    );
    if (alreadyRecorded) {
      res.status(200).json({ ok: true, alreadyProcessed: true });
      return;
    }

    const email = payment.external_reference?.startsWith("plan-")
      ? payment.external_reference.slice("plan-".length)
      : undefined;
    if (!email) {
      console.error("[mercadopago-webhook] no plan external_reference", {
        paymentId: payment.id,
        externalReference: payment.external_reference,
      });
      res.status(200).json({ ok: true, unmatched: true });
      return;
    }

    const purchase = await findPendingPlanPurchaseByEmail(email);
    if (!purchase) {
      // No hay una compra "pending" esperando este pago — puede ser un
      // reintento tardío de una compra que el propio /api/plan-pay ya
      // aprobó por la vía síncrona, o una notificación de otro flujo.
      res.status(200).json({ ok: true, unmatched: true });
      return;
    }

    if (payment.status === "approved") {
      const amount = payment.transaction_amount ?? purchase.amount ?? 0;
      const row = await markPlanPurchaseApprovedWithPayment(
        purchase.id,
        String(payment.id),
        amount
      );
      try {
        const plan = findPlan(row.audience, row.tier);
        await sendPlanConfirmationEmail(
          row.email,
          row.fullName,
          row.planLabel,
          plan?.price ?? ""
        );
      } catch (emailError) {
        console.error(
          "[mercadopago-webhook] confirmation email failed",
          emailError
        );
      }
    } else if (
      payment.status === "rejected" ||
      payment.status === "cancelled"
    ) {
      await markPlanPurchaseRejected(purchase.id);
    }
    // Otros estados (pending, in_process, authorized) no requieren acción:
    // esperamos la próxima notificación cuando cambien.

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[mercadopago-webhook] failed", error);
    // 500 para que Mercado Pago reintente — puede ser un corte transitorio
    // de red o de la base de datos, no un rechazo definitivo.
    res.status(500).json({ error: "server_error" });
  }
}
