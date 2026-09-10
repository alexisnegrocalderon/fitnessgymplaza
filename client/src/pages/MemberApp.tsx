import { useEffect, useState } from "react";
import { CalendarCheck, LogOut, Mail } from "lucide-react";
import { BrandMark } from "@/components/common";
import { findPlan, type PlanTier } from "@shared/plans";

type Me = {
  member: {
    id: number;
    email: string;
    fullName: string;
    audience: "general" | "student";
    studentCertificateStatus:
      | "not_applicable"
      | "pending_verification"
      | "verified";
  };
  plan: { tier: PlanTier; creditsRemaining: number; expiresAt: string } | null;
};

type ClassSession = {
  id: number;
  date: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  coachName: string | null;
  myBookingStatus: "booked" | "waitlisted" | null;
  myBookingId: number | null;
  canBook: boolean;
  canBookReason: "too_early" | "too_late" | "session_cancelled" | null;
};

type BookingRow = {
  bookingId: number;
  sessionId: number;
  status: "booked" | "waitlisted" | "cancelled" | "attended" | "no_show";
  date: string;
  startsAt: string;
  coachName: string | null;
};

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "Ese enlace no es válido.",
  expired_link: "Ese enlace ya venció o ya fue usado. Pide uno nuevo.",
  server_error: "Algo falló de nuestro lado. Intenta de nuevo.",
};

function chileDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function chileTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const CANT_BOOK_REASON: Record<string, string> = {
  too_early: "Todavía no se abren los cupos",
  too_late: "Inscripción cerrada",
  session_cancelled: "Clase cancelada",
};

function LoginScreen({ onSent }: { onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code)
      setError(LOGIN_ERROR_MESSAGES[code] ?? LOGIN_ERROR_MESSAGES.server_error);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      onSent();
    } catch {
      setError("No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-login">
      <div className="app-login__panel">
        <BrandMark className="app-login__mark" />
        <h1>Tu cuenta en Plaza Fitness</h1>
        {sent ? (
          <p className="app-login__sub">
            Si <strong>{email}</strong> tiene una cuenta, te llegó un enlace
            para entrar. Revisa tu correo (y spam).
          </p>
        ) : (
          <>
            <p className="app-login__sub">
              Ingresa el email con el que compraste tu plan y te enviamos un
              enlace para entrar — sin contraseña.
            </p>
            <form onSubmit={submit}>
              <label htmlFor="app-email">Email</label>
              <input
                id="app-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                autoComplete="email"
                required
              />
              {error && <p className="app-login__error">{error}</p>}
              <button
                type="submit"
                className="button button--cobalt"
                disabled={sending}
              >
                {sending ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
            <p className="app-login__hint">
              <Mail size={14} /> ¿Todavía no tienes plan?{" "}
              <a href="/planes">Contrátalo acá</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function PlanCard({ me }: { me: Me }) {
  if (!me.plan) {
    return (
      <div className="app-plan-card app-plan-card--empty">
        <p>No tienes un plan activo.</p>
        <a href="/planes" className="button button--cobalt">
          Contratar un plan
        </a>
      </div>
    );
  }
  const plan = findPlan(me.member.audience, me.plan.tier);
  return (
    <div className="app-plan-card">
      <div>
        <p className="app-plan-card__tier">{plan?.label ?? me.plan.tier}</p>
        <p className="app-plan-card__sub">
          Vence el {new Date(me.plan.expiresAt).toLocaleDateString("es-CL")}
        </p>
      </div>
      <div className="app-plan-card__credits">
        <span className="app-plan-card__credits-number">
          {me.plan.creditsRemaining}
        </span>
        <span>clases disponibles</span>
      </div>
    </div>
  );
}

function AgendaTab({ onChanged }: { onChanged: () => void }) {
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/classes");
    if (res.ok) setSessions((await res.json()).sessions);
  }

  useEffect(() => {
    load();
  }, []);

  async function book(session: ClassSession) {
    setBusyId(session.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/classes/${session.id}/book`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message ?? "No se pudo reservar.");
      } else if (data.booking.status === "waitlisted") {
        setNotice("La clase estaba llena — quedaste en lista de espera.");
      }
      await load();
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(session: ClassSession) {
    if (!session.myBookingId) return;
    setBusyId(session.id);
    setNotice(null);
    try {
      await fetch(`/api/classes/${session.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: session.myBookingId }),
      });
      await load();
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (sessions === null) return <p className="app-empty">Cargando…</p>;
  if (sessions.length === 0)
    return <p className="app-empty">No hay clases programadas por ahora.</p>;

  const byDate = new Map<string, ClassSession[]>();
  for (const s of sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }

  return (
    <div className="app-agenda">
      {notice && <p className="app-notice">{notice}</p>}
      {Array.from(byDate.entries()).map(([date, rows]) => (
        <div key={date} className="app-agenda__day">
          <p className="app-agenda__date">{chileDate(rows[0].startsAt)}</p>
          {rows.map(s => (
            <div key={s.id} className="app-class-row">
              <div>
                <p className="app-class-row__time">
                  {chileTime(s.startsAt)}–{chileTime(s.endsAt)}
                  {s.coachName ? ` · ${s.coachName}` : ""}
                </p>
                <p className="app-class-row__spots">
                  {s.myBookingStatus === "waitlisted"
                    ? "Estás en lista de espera"
                    : `${s.spotsLeft} cupo(s) disponibles`}
                </p>
              </div>
              {s.myBookingStatus ? (
                <button
                  type="button"
                  className="button button--compact"
                  onClick={() => cancel(s)}
                  disabled={busyId === s.id}
                >
                  Cancelar
                </button>
              ) : s.canBook ? (
                <button
                  type="button"
                  className="button button--cobalt button--compact"
                  onClick={() => book(s)}
                  disabled={busyId === s.id}
                >
                  {s.spotsLeft > 0 ? "Reservar" : "Lista de espera"}
                </button>
              ) : (
                <span className="app-class-row__closed">
                  {s.canBookReason
                    ? CANT_BOOK_REASON[s.canBookReason]
                    : "No disponible"}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const HISTORY_LABEL: Record<BookingRow["status"], string> = {
  booked: "Confirmada",
  waitlisted: "Lista de espera",
  cancelled: "Cancelada",
  attended: "Asististe",
  no_show: "No llegaste",
};

function MisReservasTab() {
  const [upcoming, setUpcoming] = useState<BookingRow[] | null>(null);
  const [history, setHistory] = useState<BookingRow[]>([]);

  useEffect(() => {
    fetch("/api/me/bookings")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        setUpcoming(data.upcoming);
        setHistory(data.history);
      });
  }, []);

  if (upcoming === null) return <p className="app-empty">Cargando…</p>;

  return (
    <div className="app-agenda">
      <p className="app-agenda__date">Próximas</p>
      {upcoming.length === 0 ? (
        <p className="app-empty">No tienes reservas próximas.</p>
      ) : (
        upcoming.map(b => (
          <div key={b.bookingId} className="app-class-row">
            <div>
              <p className="app-class-row__time">
                {chileDate(b.startsAt)} · {chileTime(b.startsAt)}
                {b.coachName ? ` · ${b.coachName}` : ""}
              </p>
            </div>
            <span className="app-class-row__closed">
              {HISTORY_LABEL[b.status]}
            </span>
          </div>
        ))
      )}
      {history.length > 0 && (
        <>
          <p className="app-agenda__date" style={{ marginTop: 16 }}>
            Historial
          </p>
          {history.slice(0, 20).map(b => (
            <div key={b.bookingId} className="app-class-row">
              <div>
                <p className="app-class-row__time">
                  {chileDate(b.startsAt)} · {chileTime(b.startsAt)}
                </p>
              </div>
              <span className="app-class-row__closed">
                {HISTORY_LABEL[b.status]}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Dashboard({
  me,
  onLogout,
  onRefresh,
}: {
  me: Me;
  onLogout: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"agenda" | "reservas">("agenda");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  return (
    <div className="app-dashboard">
      <header className="app-dashboard__header">
        <div className="app-dashboard__brand">
          <BrandMark className="app-dashboard__mark" />
          <div>
            <h1>Hola, {me.member.fullName.split(" ")[0]}</h1>
          </div>
        </div>
        <button
          type="button"
          className="app-dashboard__logout"
          onClick={logout}
        >
          <LogOut size={15} /> Salir
        </button>
      </header>

      <PlanCard me={me} />

      <div className="app-tabs">
        <button
          type="button"
          className={tab === "agenda" ? "is-active" : ""}
          onClick={() => setTab("agenda")}
        >
          <CalendarCheck size={15} /> Agenda
        </button>
        <button
          type="button"
          className={tab === "reservas" ? "is-active" : ""}
          onClick={() => setTab("reservas")}
        >
          Mis reservas
        </button>
      </div>

      <div className="app-dashboard__panel">
        {tab === "agenda" ? (
          <AgendaTab onChanged={onRefresh} />
        ) : (
          <MisReservasTab />
        )}
      </div>
    </div>
  );
}

export default function MemberApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = cargando

  async function load() {
    const res = await fetch("/api/auth/me");
    setMe(res.ok ? await res.json() : null);
  }

  useEffect(() => {
    load();
  }, []);

  if (me === undefined) return <div className="app-loading" />;
  if (me === null) return <LoginScreen onSent={() => {}} />;

  return <Dashboard me={me} onLogout={() => setMe(null)} onRefresh={load} />;
}
