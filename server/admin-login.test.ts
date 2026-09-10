import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./lib/adminAuth.js", () => ({
  createAdminSessionCookie: vi.fn(
    async () => "pf_admin_session=token; HttpOnly"
  ),
}));

import handler from "../api/admin/login.js";
import { createAdminSessionCookie } from "./lib/adminAuth.js";

function responseRecorder() {
  const recorded = {
    statusCode: 0,
    body: null as unknown,
    headers: {} as Record<string, unknown>,
  };
  const response = {
    status(code: number) {
      recorded.statusCode = code;
      return response;
    },
    json(body: unknown) {
      recorded.body = body;
      return response;
    },
    setHeader(name: string, value: unknown) {
      recorded.headers[name] = value;
      return response;
    },
  };
  return { recorded, response };
}

function loginRequest(body: Record<string, unknown>) {
  return { method: "POST", headers: {}, body };
}

describe("login del panel admin", () => {
  const originalEmail = process.env.ADMIN_EMAIL;
  const originalPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_EMAIL = "dueno@plazafitness.cl";
    process.env.ADMIN_PASSWORD = "clave-secreta";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalEmail;
    process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("no filtra ninguna pista sobre por qué fallaron las credenciales", async () => {
    const { recorded, response } = responseRecorder();

    await handler(
      loginRequest({
        email: "dueno@plazafitness.cl",
        password: "clave-incorrecta",
      }) as never,
      response as never
    );

    expect(recorded.statusCode).toBe(401);
    // El body debe ser exactamente { error: "invalid_credentials" } — nada
    // de `debug`, `emailMatches`, `passwordMatches` ni diferencias de largo
    // que sirvan de oráculo para adivinar la contraseña por partes.
    expect(recorded.body).toEqual({ error: "invalid_credentials" });
    expect(createAdminSessionCookie).not.toHaveBeenCalled();
  });

  it("no filtra pistas tampoco cuando el email no coincide", async () => {
    const { recorded, response } = responseRecorder();

    await handler(
      loginRequest({
        email: "otro@correo.cl",
        password: "clave-secreta",
      }) as never,
      response as never
    );

    expect(recorded.statusCode).toBe(401);
    expect(recorded.body).toEqual({ error: "invalid_credentials" });
  });

  it("acepta credenciales correctas y arma la cookie de sesión", async () => {
    const { recorded, response } = responseRecorder();

    await handler(
      loginRequest({
        email: "Dueno@PlazaFitness.cl ",
        password: "clave-secreta",
      }) as never,
      response as never
    );

    expect(createAdminSessionCookie).toHaveBeenCalledOnce();
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toEqual({ ok: true });
    expect(recorded.headers["Set-Cookie"]).toContain("pf_admin_session");
  });
});
