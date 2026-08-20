import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, XCircle } from "lucide-react";
import type { Registration } from "../../../drizzle/schema";

type Session = "checking" | "out" | "in";

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
        setError(
          res.status === 429
            ? "Demasiados intentos. Espera un minuto."
            : "Credenciales incorrectas."
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
      <form onSubmit={onSubmit} className="admin-login__panel glass-card">
        <h1>Panel Plaza Fitness</h1>
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

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      if (res.status === 401) {
        onLoggedOut();
        return;
      }
      const data = await res.json();
      setRows(data.registrations ?? []);
    } catch {
      setError("No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
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

  const activeCount = rows.filter(r => r.status !== "rejected").length;

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1>Inscripciones — Gran Inauguración</h1>
          <p>
            {activeCount} / 100 cupos usados ·{" "}
            {rows.filter(r => r.status === "pending").length} pendientes de
            aprobar
          </p>
        </div>
        <button
          type="button"
          className="admin-dashboard__logout"
          onClick={logout}
        >
          <LogOut size={15} /> Salir
        </button>
      </header>

      {error && <p className="admin-dashboard__error">{error}</p>}

      {loading ? (
        <p className="admin-dashboard__empty">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="admin-dashboard__empty">Todavía no hay inscripciones.</p>
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
                  <td>{new Date(row.createdAt).toLocaleDateString("es-CL")}</td>
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
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session>("checking");

  useEffect(() => {
    fetch("/api/admin/registrations")
      .then(res => setSession(res.status === 401 ? "out" : "in"))
      .catch(() => setSession("out"));
  }, []);

  if (session === "checking") return null;

  return session === "in" ? (
    <Dashboard onLoggedOut={() => setSession("out")} />
  ) : (
    <LoginForm onLoggedIn={() => setSession("in")} />
  );
}
