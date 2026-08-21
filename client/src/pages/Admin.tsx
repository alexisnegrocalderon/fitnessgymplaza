import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  LogOut,
  Mail,
  MessageCircle,
  Percent,
  Send,
  Ticket,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { formatCLP } from "@shared/format";
import { EVENT_CAPACITY, calculateServiceCharge } from "@shared/registration";
import { findPlan, planPriceToNumber } from "@shared/plans";
import type { PlanPurchase, Registration } from "../../../drizzle/schema";

type MpStatus =
  | { connected: false }
  | {
      connected: true;
      mpUserId: string;
      liveMode: boolean;
      connectedAt: string;
    };

const mpMessages: Record<string, string> = {
  connected: "Cuenta de Mercado Pago conectada correctamente.",
  denied: "Conexión cancelada — no se autorizó el acceso en Mercado Pago.",
  invalid_state:
    "El enlace de conexión expiró o no es válido. Intenta de nuevo.",
  error: "No se pudo completar la conexión con Mercado Pago. Intenta de nuevo.",
};

function MercadoPagoPanel() {
  const [status, setStatus] = useState<MpStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mp = params.get("mp");
    if (mp && mpMessages[mp]) {
      setNotice(mpMessages[mp]);
      params.delete("mp");
      const rest = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (rest ? `?${rest}` : "")
      );
    }

    fetch("/api/admin/mercadopago/status")
      .then(res => (res.ok ? res.json() : { connected: false }))
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  if (!status) return null;

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <CreditCard size={18} />
        <div>
          <p className="admin-mp__title">Mercado Pago</p>
          <p className="admin-mp__sub">
            {status.connected
              ? `Conectado el ${new Date(status.connectedAt).toLocaleDateString("es-CL")} · cuenta ${status.mpUserId}${status.liveMode ? "" : " (modo prueba)"}`
              : "Sin conectar — los pagos de /planes no funcionarán hasta conectar tu cuenta."}
          </p>
        </div>
      </div>
      <a
        href="/api/admin/mercadopago/connect"
        className="button button--cobalt"
      >
        {status.connected ? "Reconectar" : "Conectar Mercado Pago"}
      </a>
      {notice && <p className="admin-mp__notice">{notice}</p>}
    </div>
  );
}

function ServiceChargePanel() {
  const [bps, setBps] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        setBps(data.serviceChargeBps);
        setDraft((data.serviceChargeBps / 100).toString());
      })
      .catch(() => {});
  }, []);

  async function save() {
    const percent = Number(draft.replace(",", "."));
    if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
      setNotice("Ingresa un porcentaje válido entre 0 y 50.");
      return;
    }
    const nextBps = Math.round(percent * 100);
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceChargeBps: nextBps }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setBps(data.serviceChargeBps);
      setNotice("Cargo por servicio actualizado.");
    } catch {
      setNotice("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (bps === null) return null;

  const examplePlan = findPlan("general", "twelve");
  const examplePrice = examplePlan ? planPriceToNumber(examplePlan) : 0;
  const preview = calculateServiceCharge(examplePrice, bps);

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <Percent size={18} />
        <div>
          <p className="admin-mp__title">Cargo por servicio</p>
          <p className="admin-mp__sub">
            Se suma al valor del plan en /planes al pagar. Ejemplo con 12 clases
            general: {formatCLP(preview)} sobre {formatCLP(examplePrice)} (total{" "}
            {formatCLP(examplePrice + preview)}).
          </p>
        </div>
      </div>
      <div className="admin-mp__charge-editor">
        <input
          type="number"
          min={0}
          max={50}
          step={0.5}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          aria-label="Porcentaje de cargo por servicio"
        />
        <span>%</span>
        <button
          type="button"
          className="button button--cobalt"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {notice && <p className="admin-mp__notice">{notice}</p>}
    </div>
  );
}

function TestEmailPanel() {
  const [to, setTo] = useState("");
  const [template, setTemplate] = useState<"invitation" | "plan">("plan");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function send() {
    if (!to.trim()) {
      setNotice("Ingresa un email de destino.");
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, template }),
      });
      const data = await res.json().catch(() => ({}));
      setNotice(
        res.ok
          ? `Correo de prueba enviado a ${to}.`
          : `No se pudo enviar: ${data.message ?? data.error ?? "error desconocido"}.`
      );
    } catch {
      setNotice("No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <Mail size={18} />
        <div>
          <p className="admin-mp__title">Correo de prueba</p>
          <p className="admin-mp__sub">
            Manda una de las plantillas con datos de ejemplo a la dirección que
            quieras, para ver cómo llega de verdad a una bandeja.
          </p>
        </div>
      </div>
      <div className="admin-mp__charge-editor">
        <input
          type="email"
          placeholder="tu@email.com"
          value={to}
          onChange={e => setTo(e.target.value)}
          aria-label="Email de destino"
        />
        <select
          value={template}
          onChange={e => setTemplate(e.target.value as "invitation" | "plan")}
          aria-label="Plantilla"
        >
          <option value="plan">Plan confirmado</option>
          <option value="invitation">Invitación evento</option>
        </select>
        <button
          type="button"
          className="button button--cobalt"
          onClick={send}
          disabled={sending}
        >
          {sending ? "Enviando…" : "Enviar prueba"}
        </button>
      </div>
      {notice && <p className="admin-mp__notice">{notice}</p>}
    </div>
  );
}

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

/** wa.me solo acepta dígitos — se limpia +, espacios y guiones del input. */
function waLink(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

/** Lo que el panel está a punto de borrar. `requiresPassword` marca las
 * filas con dinero asociado (pago de Mercado Pago o monto): ahí la doble
 * confirmación no basta y se vuelve a pedir la clave del admin. */
type DeleteTarget = {
  kind: "registration" | "plan";
  id: number;
  name: string;
  detail: string;
  requiresPassword: boolean;
};

function DeleteDialog({
  target,
  onCancel,
  onDeleted,
  onUnauthorized,
}: {
  target: DeleteTarget;
  onCancel: () => void;
  onDeleted: () => void;
  onUnauthorized: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (target.requiresPassword && !password.trim()) {
      setError("Ingresa la clave de admin para continuar.");
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const path =
        target.kind === "plan"
          ? `/api/admin/plans/${target.id}`
          : `/api/admin/registrations/${target.id}`;
      const res = await fetch(path, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, password }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 || data.error === "invalid_password") {
        setError("La clave de admin no coincide.");
        return;
      }
      if (!res.ok) {
        setError("No se pudo eliminar. Intenta de nuevo.");
        return;
      }
      onDeleted();
    } catch {
      setError("No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="admin-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <div className="admin-confirm__panel">
        <span className="admin-confirm__icon">
          <AlertTriangle size={20} />
        </span>
        {step === 1 ? (
          <>
            <h2 id="admin-confirm-title">¿Eliminar a {target.name}?</h2>
            <p>
              {target.detail} Se borra de forma permanente del panel y de la
              base de datos.
            </p>
            <div className="admin-confirm__actions">
              <button type="button" onClick={onCancel}>
                Cancelar
              </button>
              <button
                type="button"
                className="admin-confirm__danger"
                onClick={() => setStep(2)}
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="admin-confirm-title">Confirmación final</h2>
            <p>
              Esta acción no se puede deshacer.
              {target.requiresPassword
                ? " Tiene valores asociados, así que confirma con tu clave de admin."
                : ""}
            </p>
            {target.requiresPassword && (
              <label className="admin-confirm__field">
                <span>Clave de admin</span>
                <input
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") confirmDelete();
                  }}
                />
              </label>
            )}
            {error && <p className="admin-confirm__error">{error}</p>}
            <div className="admin-confirm__actions">
              <button type="button" onClick={onCancel} disabled={deleting}>
                Cancelar
              </button>
              <button
                type="button"
                className="admin-confirm__danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function registrationDeleteTarget(row: Registration): DeleteTarget {
  const hasValue = Boolean(row.mpPaymentId) || (row.amount ?? 0) > 0;
  return {
    kind: "registration",
    id: row.id,
    name: row.fullName,
    detail: hasValue
      ? "Esta inscripción tiene un pago asociado."
      : "Se elimina su inscripción a la Gran Inauguración.",
    requiresPassword: hasValue,
  };
}

function planDeleteTarget(row: PlanPurchase): DeleteTarget {
  return {
    kind: "plan",
    id: row.id,
    name: row.fullName,
    detail: `Se elimina la compra del plan ${row.planLabel}, con su registro de pago.`,
    requiresPassword: true,
  };
}

function ClientesTable({
  rows,
  onDelete,
}: {
  rows: Registration[];
  onDelete: (row: Registration) => void;
}) {
  if (rows.length === 0) {
    return <p className="admin-dashboard__empty">Todavía no hay clientes.</p>;
  }

  return (
    <div className="admin-dashboard__table-wrap">
      <table className="admin-dashboard__table admin-dashboard__table--clientes">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Estado</th>
            <th>Desde</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.fullName}</td>
              <td>
                <a href={`mailto:${row.email}`} className="admin-contact-link">
                  <Mail size={14} /> {row.email}
                </a>
              </td>
              <td>
                <a
                  href={waLink(row.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-contact-link"
                >
                  <MessageCircle size={14} /> {row.whatsapp}
                </a>
              </td>
              <td>
                <span
                  className={`admin-dashboard__status admin-dashboard__status--${row.status}`}
                >
                  {statusLabel[row.status]}
                </span>
              </td>
              <td>{new Date(row.createdAt).toLocaleDateString("es-CL")}</td>
              <td className="admin-dashboard__actions">
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  title="Eliminar contacto"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanesTable({
  rows,
  onDelete,
}: {
  rows: PlanPurchase[];
  onDelete: (row: PlanPurchase) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="admin-dashboard__empty">Todavía no hay planes vendidos.</p>
    );
  }

  return (
    <div className="admin-dashboard__table-wrap">
      <table className="admin-dashboard__table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Plan</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.fullName}</td>
              <td>{row.rut}</td>
              <td>
                <a href={`mailto:${row.email}`} className="admin-contact-link">
                  <Mail size={14} /> {row.email}
                </a>
              </td>
              <td>
                <a
                  href={waLink(row.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-contact-link"
                >
                  <MessageCircle size={14} /> {row.whatsapp}
                </a>
              </td>
              <td>
                {row.planLabel}
                {row.audience === "student" ? " · estudiante" : ""}
              </td>
              <td>
                <span
                  className={`admin-dashboard__status admin-dashboard__status--${row.status}`}
                >
                  {statusLabel[row.status]}
                </span>
              </td>
              <td>{new Date(row.createdAt).toLocaleDateString("es-CL")}</td>
              <td className="admin-dashboard__actions">
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  title="Eliminar compra"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [planRows, setPlanRows] = useState<PlanPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"inscripciones" | "clientes" | "planes">(
    "inscripciones"
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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

  async function loadPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.purchases)) setPlanRows(data.purchases);
    } catch {
      // El tab de planes queda vacío si falla — no bloquea el resto del panel.
    }
  }

  useEffect(() => {
    load();
    loadPlans();
  }, []);

  async function act(id: number, action: "approve" | "reject" | "resend") {
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
          `No se pudo enviar el correo de invitación${
            data.message ? ` (${data.message})` : ""
          }. Revisa la configuración de Resend y reintenta con "Reenviar invitación".`
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

      <MercadoPagoPanel />
      <ServiceChargePanel />
      <TestEmailPanel />

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

      <div className="admin-tabs">
        <button
          type="button"
          className={tab === "inscripciones" ? "is-active" : ""}
          onClick={() => setTab("inscripciones")}
        >
          Inscripciones
        </button>
        <button
          type="button"
          className={tab === "clientes" ? "is-active" : ""}
          onClick={() => setTab("clientes")}
        >
          Clientes
        </button>
        <button
          type="button"
          className={tab === "planes" ? "is-active" : ""}
          onClick={() => setTab("planes")}
        >
          Planes
        </button>
      </div>

      <div className="admin-dashboard__panel">
        {loading ? (
          <p className="admin-dashboard__empty">Cargando…</p>
        ) : tab === "clientes" ? (
          <ClientesTable
            rows={rows}
            onDelete={row => setDeleteTarget(registrationDeleteTarget(row))}
          />
        ) : tab === "planes" ? (
          <PlanesTable
            rows={planRows}
            onDelete={row => setDeleteTarget(planDeleteTarget(row))}
          />
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
                  <th>Invitación</th>
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
                      {row.invitationSentAt ? (
                        <span className="admin-dashboard__status admin-dashboard__status--approved">
                          Enviada{" "}
                          {new Date(row.invitationSentAt).toLocaleDateString(
                            "es-CL"
                          )}
                        </span>
                      ) : (
                        <span className="admin-dashboard__status admin-dashboard__status--pending">
                          Sin enviar
                        </span>
                      )}
                    </td>
                    <td>
                      {new Date(row.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="admin-dashboard__actions">
                      {row.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => act(row.id, "resend")}
                          disabled={actingId === row.id}
                          title="Reenviar invitación por correo"
                        >
                          <Send size={16} />
                        </button>
                      )}
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
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget(registrationDeleteTarget(row))
                        }
                        disabled={actingId === row.id}
                        title="Eliminar inscripción"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onUnauthorized={onLoggedOut}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
            loadPlans();
          }}
        />
      )}
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
