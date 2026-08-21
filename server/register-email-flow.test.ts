import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  existing: null as null | {
    id: number;
    status: "approved" | "pending";
    email: string;
    fullName: string;
    invitationSentAt: Date | null;
  },
  activeCount: 0,
  emailFailure: null as Error | null,
  created: {
    id: 42,
    status: "approved" as const,
    email: "persona@example.com",
    fullName: "Persona de Prueba",
    invitationSentAt: null,
  },
}));

vi.mock("../server/db.js", () => ({
  EVENT_CAPACITY: 100,
  findRegistrationByEmail: vi.fn(async () => state.existing),
  countActiveRegistrations: vi.fn(async () => state.activeCount),
  createApprovedRegistration: vi.fn(async () => state.created),
  approveRegistration: vi.fn(async () => ({
    ...state.existing,
    status: "approved",
  })),
  updateRegistrationContact: vi.fn(async () => state.existing),
  markInvitationSent: vi.fn(async () => state.created),
}));

vi.mock("../server/lib/resend.js", () => ({
  sendInvitationEmail: vi.fn(async () => {
    if (state.emailFailure) throw state.emailFailure;
  }),
}));

import handler from "../api/register";
import {
  approveRegistration,
  createApprovedRegistration,
  markInvitationSent,
  updateRegistrationContact,
} from "../server/db.js";
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

function registrationRequest() {
  return {
    method: "POST",
    body: {
      fullName: "Persona de Prueba",
      email: "persona@example.com",
      whatsapp: "+56 9 5225 4029",
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

  it("guarda la inscripción, envía la invitación y sella el envío", async () => {
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(createApprovedRegistration).toHaveBeenCalledOnce();
    expect(sendInvitationEmail).toHaveBeenCalledOnce();
    expect(markInvitationSent).toHaveBeenCalledWith(42);
    expect(recorded.statusCode).toBe(201);
    expect(recorded.body).toEqual({ ok: true, emailSent: true });
  });

  it("confirma el registro nuevo aunque el proveedor rechace el correo", async () => {
    state.emailFailure = new Error("sender_not_verified");
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(createApprovedRegistration).toHaveBeenCalledOnce();
    expect(markInvitationSent).not.toHaveBeenCalled();
    expect(recorded.statusCode).toBe(201);
    expect(recorded.body).toEqual({ ok: true, emailSent: false });
  });

  it("reenvía la invitación cuando alguien ya inscrito vuelve al formulario", async () => {
    state.existing = {
      id: 4,
      status: "approved",
      email: "persona@example.com",
      fullName: "Nombre Antiguo",
      invitationSentAt: new Date(Date.now() - 60 * 60 * 1000),
    };
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(sendInvitationEmail).toHaveBeenCalledOnce();
    expect(updateRegistrationContact).toHaveBeenCalledWith(4, {
      fullName: "Persona de Prueba",
      whatsapp: "+56 9 5225 4029",
    });
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({
      ok: true,
      alreadyRegistered: true,
      emailSent: true,
    });
  });

  it("no vuelve a enviar si la invitación salió hace segundos", async () => {
    state.existing = {
      id: 4,
      status: "approved",
      email: "persona@example.com",
      fullName: "Persona de Prueba",
      invitationSentAt: new Date(),
    };
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(sendInvitationEmail).not.toHaveBeenCalled();
    expect(recorded.body).toEqual({
      ok: true,
      alreadyRegistered: true,
      emailSent: true,
    });
  });

  it("completa y notifica una fila pendiente heredada", async () => {
    state.existing = {
      id: 7,
      status: "pending",
      email: "persona@example.com",
      fullName: "Persona de Prueba",
      invitationSentAt: null,
    };
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(approveRegistration).toHaveBeenCalledWith(7);
    expect(sendInvitationEmail).toHaveBeenCalledOnce();
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({
      ok: true,
      alreadyRegistered: true,
      emailSent: true,
    });
  });

  it("cierra el formulario cuando el cupo está lleno", async () => {
    state.activeCount = 100;
    const { recorded, response } = responseRecorder();

    await handler(registrationRequest() as never, response as never);

    expect(createApprovedRegistration).not.toHaveBeenCalled();
    expect(recorded.statusCode).toBe(409);
  });
});
