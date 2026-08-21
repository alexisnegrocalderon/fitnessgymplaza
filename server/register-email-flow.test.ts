import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  existing: null as null | {
    id: number;
    status: "approved" | "pending";
    email: string;
    fullName: string;
  },
  activeCount: 0,
  emailFailure: null as Error | null,
  created: {
    id: 42,
    status: "approved" as const,
    email: "persona@example.com",
    fullName: "Persona de Prueba",
  },
}));

vi.mock("../server/db.js", () => ({
  EVENT_CAPACITY: 100,
  findRegistrationByContact: vi.fn(async () => state.existing),
  countActiveRegistrations: vi.fn(async () => state.activeCount),
  createApprovedRegistration: vi.fn(async () => state.created),
  approveRegistration: vi.fn(async () => state.created),
}));

vi.mock("../server/lib/resend.js", () => ({
  sendInvitationEmail: vi.fn(async () => {
    if (state.emailFailure) throw state.emailFailure;
  }),
}));

import handler from "../api/register";
import { sendInvitationEmail } from "../server/lib/resend.js";

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

function registrationRequest(resend = false) {
  return {
    method: "POST",
    body: {
      fullName: "Persona de Prueba",
      email: "persona@example.com",
      whatsapp: "+56 9 5225 4029",
      resend,
    },
  };
}

describe("registro de inauguración y entrega de correo", () => {
  beforeEach(() => {
    state.existing = null;
    state.activeCount = 0;
    state.emailFailure = null;
    vi.clearAllMocks();
  });

  it("no confirma un registro nuevo cuando el proveedor rechaza el correo", async () => {
    state.emailFailure = new Error("sender_not_verified");
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(recorded.statusCode).toBe(502);
    expect(recorded.body).toEqual({ error: "email_delivery_failed" });
  });

  it("permite reenviar de forma explícita a una inscripción aprobada", async () => {
    state.existing = {
      id: 4,
      status: "approved",
      email: "persona@example.com",
      fullName: "Persona de Prueba",
    };
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest(true) as never, response as never);

    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({
      ok: true,
      alreadyRegistered: true,
      emailResent: true,
    });
    expect(sendInvitationEmail).toHaveBeenCalledOnce();
  });

  it("no reenvía automáticamente una inscripción duplicada", async () => {
    state.existing = {
      id: 4,
      status: "approved",
      email: "persona@example.com",
      fullName: "Persona de Prueba",
    };
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ok: true, alreadyRegistered: true });
    expect(sendInvitationEmail).not.toHaveBeenCalled();
  });
});
