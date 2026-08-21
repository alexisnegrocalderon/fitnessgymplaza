import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  registration: {
    id: 5,
    fullName: "Persona de Prueba",
    email: "persona@example.com",
    status: "approved" as const,
    mpPaymentId: null as string | null,
    amount: null as number | null,
  },
}));

vi.mock("../server/db.js", () => ({
  getRegistrationById: vi.fn(async () => state.registration),
  deleteRegistration: vi.fn(async () => state.registration),
  markInvitationSent: vi.fn(async () => state.registration),
  markRegistrationApproved: vi.fn(async () => state.registration),
  markRegistrationRejected: vi.fn(async () => state.registration),
}));

vi.mock("../server/lib/adminAuth.js", () => ({
  isAdminRequest: vi.fn(async () => true),
  verifyAdminPassword: vi.fn((password?: string) => password === "clave-real"),
}));

vi.mock("../server/lib/resend.js", () => ({
  sendInvitationEmail: vi.fn(async () => {}),
}));

import handler from "../api/admin/registrations/[id]";
import { deleteRegistration } from "../server/db.js";

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
    setHeader() {
      return response;
    },
  };
  return { recorded, response };
}

function deleteRequest(body: Record<string, unknown>) {
  return {
    method: "DELETE",
    query: { id: "5" },
    headers: { cookie: "x" },
    body,
  };
}

describe("borrado de contactos en el panel", () => {
  beforeEach(() => {
    state.registration.mpPaymentId = null;
    state.registration.amount = null;
    vi.clearAllMocks();
  });

  it("exige la confirmación explícita", async () => {
    const { recorded, response } = responseRecorder();

    await handler(deleteRequest({}) as never, response as never);

    expect(deleteRegistration).not.toHaveBeenCalled();
    expect(recorded.statusCode).toBe(400);
    expect(recorded.body).toEqual({ error: "confirmation_required" });
  });

  it("borra una inscripción sin valores asociados sin pedir clave", async () => {
    const { recorded, response } = responseRecorder();

    await handler(deleteRequest({ confirm: true }) as never, response as never);

    expect(deleteRegistration).toHaveBeenCalledWith(5);
    expect(recorded.statusCode).toBe(200);
  });

  it("rechaza el borrado con pago asociado si la clave no coincide", async () => {
    state.registration.mpPaymentId = "mp-123";
    const { recorded, response } = responseRecorder();

    await handler(
      deleteRequest({ confirm: true, password: "otra" }) as never,
      response as never
    );

    expect(deleteRegistration).not.toHaveBeenCalled();
    expect(recorded.statusCode).toBe(403);
    expect(recorded.body).toEqual({ error: "invalid_password" });
  });

  it("permite el borrado con pago asociado usando la clave correcta", async () => {
    state.registration.amount = 60000;
    const { recorded, response } = responseRecorder();

    await handler(
      deleteRequest({ confirm: true, password: "clave-real" }) as never,
      response as never
    );

    expect(deleteRegistration).toHaveBeenCalledWith(5);
    expect(recorded.statusCode).toBe(200);
  });
});
