import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  LogOut,
  Ticket,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { EVENT_CAPACITY } from "@shared/registration";
import type { Registration } from "../../../drizzle/schema";

type Session = "checking" | "out" | "in";

/** Solo 200 + JSON válido cuenta como sesión activa — cualquier otra
 * respuesta (401, 500, HTML de error) debe caer a la pantalla de login. */
async function fetchRegistrations(): Promise<
  { ok: true; rows: Registration[] } | { ok: false; unauthorized: boolean }
> {
  try {
    const res = await fetch("/api/admin/registrations");
    if (!res.ok) return { ok: false, unauthorized: res.status === 401 };
    const data = await res.json();
    if (!Array.isArray(data.registrations))
      return { ok: false, unauthorized: false };
    return { ok: true, rows: data.registrations };
  } catch {
    return { ok: false, unauthorized: false };
  }
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError("Demasiados intentos. Espera un minuto.");
          return;
        }
        const data = await res.json().catch(() => null);
        const code = data?.error ?? `http_${res.status}`;
        const debug = data?.debug as
          | {
              emailMatches: boolean;
              passwordMatches: boolean;
              emailLengthDiff: number;
              passwordLengthDiff: number;
            }
          | undefined;
        // No asumir que todo lo que no sea 200 es "credenciales malas": un
        // 500 (p. ej. admin_not_configured, si ADMIN_EMAIL/ADMIN_PASSWORD no
        // llegan al runtime) es un problema distinto y hay que verlo tal
        // cual para no confundirlo con una contraseña incorrecta.
        setError(
          code === "invalid_credentials" && debug
            ? `Credenciales incorrectas. [debug] email coincide: ${debug.emailMatches} (diff largo: ${debug.emailLengthDiff}) · contraseña coincide: ${debug.passwordMatches} (diff largo: ${debug.passwordLengthDiff})`
            : `Error: ${code} (HTTP ${res.status})`
        );
        return;
      }
      onLoggedIn();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={onSubmit} className="admin-login__panel">
        <BrandMark className="admin-login__mark" />
        <h1>Panel Plaza Fitness</h1>
        <p className="admin-login__sub">Gran Inauguración — inscripciones</p>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="admin-login__error">{error}</p>}
        <button
          type="submit"
          className="button button--cobalt"
          disabled={loading}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const statusLabel: Record<Registration["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

function StatTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`admin-stat ${accent ? "admin-stat--accent" : ""}`}>
      <span className="admin-stat__icon">{icon}</span>
      <span className="admin-stat__value">{value}</span>
      <span className="admin-stat__label">{label}</span>
    </div>
  );
}

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const result = await fetchRegistrations();
    if (!result.ok) {
      if (result.unauthorized) {
        onLoggedOut();
        return;
      }
      setError("No se pudo cargar la lista. Intenta de nuevo.");
      setLoading(false);
      return;
    }
    setRows(result.rows);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: number, action: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        onLoggedOut();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      if (data.emailFailed) {
        setError(
          "Se aprobó, pero el correo de invitación falló al enviarse. Revisa la config de Resend."
        );
      }
      await load();
    } catch {
      setError("No se pudo completar la acción.");
    } finally {
      setActingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLoggedOut();
  }

  const pending = rows.filter(r => r.status === "pending").length;
  const approved = rows.filter(r => r.status === "approved").length;
  const active = rows.filter(r => r.status !== "rejected").length;
  const remaining = Math.max(EVENT_CAPACITY - active, 0);

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div className="admin-dashboard__brand">
          <BrandMark className="admin-dashboard__mark" />
          <div>
            <h1>Gran Inauguración</h1>
            <p>Panel de inscripciones</p>
          </div>
        </div>
        <button
          type="button"
          className="admin-dashboard__logout"
          onClick={logout}
        >
          <LogOut size={15} /> Salir
        </button>
      </header>

      <div className="admin-stats">
        <StatTile
          icon={<Users size={18} />}
          label="Inscritos totales"
          value={rows.length}
        />
        <StatTile
          icon={<Clock size={18} />}
          label="Pendientes de aprobar"
          value={pending}
          accent
        />
        <StatTile
          icon={<UserCheck size={18} />}
          label="Aprobados"
          value={approved}
        />
        <StatTile
          icon={<Ticket size={18} />}
          label="Cupos restantes"
          value={remaining}
        />
      </div>

      {error && <p className="admin-dashboard__error">{error}</p>}

      <div className="admin-dashboard__panel">
        {loading ? (
          <p className="admin-dashboard__empty">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="admin-dashboard__empty">
            Todavía no hay inscripciones.
          </p>
        ) : (
          <div className="admin-dashboard__table-wrap">
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Estado</th>
                  <th>Inscrito</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.fullName}</td>
                    <td>{row.email}</td>
                    <td>{row.whatsapp}</td>
                    <td>
                      <span
                        className={`admin-dashboard__status admin-dashboard__status--${row.status}`}
                      >
                        {statusLabel[row.status]}
                      </span>
                    </td>
                    <td>
                      {new Date(row.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="admin-dashboard__actions">
                      {row.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => act(row.id, "approve")}
                            disabled={actingId === row.id}
                            title="Aprobar y enviar invitación"
                          >
                            <CheckCircle2 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => act(row.id, "reject")}
                            disabled={actingId === row.id}
                            title="Rechazar"
                          >
                            <XCircle size={17} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session>("checking");

  useEffect(() => {
    fetchRegistrations().then(result => setSession(result.ok ? "in" : "out"));
  }, []);

  if (session === "checking") return null;

  return session === "in" ? (
    <Dashboard onLoggedOut={() => setSession("out")} />
  ) : (
    <LoginForm onLoggedIn={() => setSession("in")} />
  );
}
