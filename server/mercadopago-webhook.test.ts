import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  purchase: {
    id: 42,
    fullName: "Alumna de Prueba",
    email: "alumna@example.com",
    rut: "11.111.111-1",
    whatsapp: "+56911111111",
    audience: "general" as const,
    tier: "eight" as const,
    planLabel: "8 clases",
    status: "pending" as const,
    mpPaymentId: null as string | null,
    amount: null as number | null,
    createdAt: new Date(),
  },
  paymentGet: null as unknown,
}));

vi.mock("../server/db.js", () => ({
  getPlanPurchaseByMpPaymentId: vi.fn(async (mpPaymentId: string) =>
    state.purchase.mpPaymentId === mpPaymentId ? state.purchase : undefined
  ),
  findPendingPlanPurchaseByEmail: vi.fn(async (email: string) =>
    state.purchase.status === "pending" && state.purchase.email === email
      ? state.purchase
      : undefined
  ),
  markPlanPurchaseApprovedWithPayment: vi.fn(
    async (id: number, mpPaymentId: string, amount: number) => {
      state.purchase.status = "approved";
      state.purchase.mpPaymentId = mpPaymentId;
      state.purchase.amount = amount;
      return state.purchase;
    }
  ),
  markPlanPurchaseRejected: vi.fn(async (id: number) => {
    state.purchase.status = "rejected" as never;
    return state.purchase;
  }),
}));

vi.mock("../server/lib/mercadopago.js", async () => {
  const actual = await vi.importActual<
    typeof import("../server/lib/mercadopago")
  >("../server/lib/mercadopago.js");
  return {
    ...actual,
    getValidAccessToken: vi.fn(async () => "test-access-token"),
  };
});

vi.mock("../server/lib/resend.js", () => ({
  sendPlanConfirmationEmail: vi.fn(async () => {}),
}));

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn().mockImplementation(() => ({
    get: vi.fn(async () => state.paymentGet),
  })),
}));

import handler from "../api/mercadopago/webhook.js";
import {
  getPlanPurchaseByMpPaymentId,
  markPlanPurchaseApprovedWithPayment,
  markPlanPurchaseRejected,
} from "../server/db.js";
import { sendPlanConfirmationEmail } from "../server/lib/resend.js";

const WEBHOOK_SECRET = "test-webhook-secret";

function webhookRequest(opts: {
  dataId: string;
  signed?: boolean;
  wrongSecret?: boolean;
}) {
  const ts = "1700000000";
  const requestId = "req-123";
  const secret = opts.wrongSecret ? "otra-clave" : WEBHOOK_SECRET;
  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  return {
    method: "POST",
    query: { type: "payment", "data.id": opts.dataId },
    headers:
      opts.signed === false
        ? {}
        : {
            "x-signature": `ts=${ts},v1=${v1}`,
            "x-request-id": requestId,
          },
    body: {},
  };
}

function responseRecorder() {
  const recorded = { statusCode: 0, body: null as unknown };
  const response = {
    status(code: number) {
      recorded.statusCode = code;
      return response;
    },
    json(body: unknown) {
      recorded.body = body;
      return response;
    },
  };
  return { recorded, response };
}

describe("webhook de Mercado Pago", () => {
  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = WEBHOOK_SECRET;
    state.purchase.status = "pending";
    state.purchase.mpPaymentId = null;
    state.purchase.amount = null;
    state.paymentGet = null;
    vi.clearAllMocks();
  });

  it("rechaza una notificación sin firma válida", async () => {
    const { recorded, response } = responseRecorder();
    await handler(
      webhookRequest({ dataId: "999", wrongSecret: true }) as never,
      response as never
    );
    expect(recorded.statusCode).toBe(401);
    expect(recorded.body).toEqual({ error: "invalid_signature" });
    expect(markPlanPurchaseApprovedWithPayment).not.toHaveBeenCalled();
  });

  it("responde 500 sin confundirlo con firma inválida si falta MP_WEBHOOK_SECRET", async () => {
    delete process.env.MP_WEBHOOK_SECRET;
    const { recorded, response } = responseRecorder();

    await handler(
      webhookRequest({ dataId: "999" }) as never,
      response as never
    );

    expect(recorded.statusCode).toBe(500);
    expect(recorded.body).toEqual({ error: "webhook_not_configured" });
  });

  it("ignora eventos que no son de pago", async () => {
    const { recorded, response } = responseRecorder();
    await handler(
      {
        method: "POST",
        query: { type: "merchant_order" },
        headers: {},
        body: {},
      } as never,
      response as never
    );
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ignored: true });
  });

  it("aprueba la compra pendiente cuando el pago llega aprobado", async () => {
    state.paymentGet = {
      id: 555,
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 47_400,
      external_reference: "plan-alumna@example.com",
    };
    const { recorded, response } = responseRecorder();

    await handler(
      webhookRequest({ dataId: "555" }) as never,
      response as never
    );

    expect(markPlanPurchaseApprovedWithPayment).toHaveBeenCalledWith(
      42,
      "555",
      47_400
    );
    expect(sendPlanConfirmationEmail).toHaveBeenCalledOnce();
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ok: true });
  });

  it("marca la compra como rechazada cuando el pago se rechaza", async () => {
    state.paymentGet = {
      id: 556,
      status: "rejected",
      status_detail: "cc_rejected_high_risk",
      transaction_amount: 47_400,
      external_reference: "plan-alumna@example.com",
    };
    const { recorded, response } = responseRecorder();

    await handler(
      webhookRequest({ dataId: "556" }) as never,
      response as never
    );

    expect(markPlanPurchaseRejected).toHaveBeenCalledWith(42);
    expect(recorded.statusCode).toBe(200);
  });

  it("es idempotente: no reprocesa un pago ya registrado", async () => {
    state.purchase.status = "approved" as never;
    state.purchase.mpPaymentId = "555";
    state.paymentGet = {
      id: 555,
      status: "approved",
      external_reference: "plan-alumna@example.com",
    };
    const { recorded, response } = responseRecorder();

    await handler(
      webhookRequest({ dataId: "555" }) as never,
      response as never
    );

    expect(getPlanPurchaseByMpPaymentId).toHaveBeenCalledWith("555");
    expect(markPlanPurchaseApprovedWithPayment).not.toHaveBeenCalled();
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ok: true, alreadyProcessed: true });
  });

  it("responde 200 sin reventar si no hay compra pendiente para ese email", async () => {
    state.paymentGet = {
      id: 777,
      status: "approved",
      transaction_amount: 47_400,
      external_reference: "plan-desconocido@example.com",
    };
    const { recorded, response } = responseRecorder();

    await handler(
      webhookRequest({ dataId: "777" }) as never,
      response as never
    );

    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ok: true, unmatched: true });
  });
});
