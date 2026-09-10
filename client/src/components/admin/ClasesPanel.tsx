import { useEffect, useState } from "react";
import {
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";

type ClassTemplate = {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  coachId: number | null;
  active: boolean;
};

type SessionRow = {
  id: number;
  date: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  status: "scheduled" | "cancelled";
  coachName: string | null;
};

type RosterEntry = {
  bookingId: number;
  status: "booked" | "waitlisted" | "cancelled" | "attended" | "no_show";
  position: number | null;
  member: { id: number; fullName: string; email: string; whatsapp: string };
};

type ClosedDate = { id: number; date: string; reason: string | null };

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Santiago",
  });
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const STATUS_LABEL: Record<RosterEntry["status"], string> = {
  booked: "Confirmado",
  waitlisted: "Lista de espera",
  cancelled: "Cancelado",
  attended: "Asistió",
  no_show: "No llegó",
};

function RosterRow({
  entry,
  onMark,
}: {
  entry: RosterEntry;
  onMark: (status: "attended" | "no_show") => void;
}) {
  return (
    <div className="admin-roster__row">
      <div>
        <p className="admin-roster__name">{entry.member.fullName}</p>
        <p className="admin-roster__contact">{entry.member.email}</p>
      </div>
      <span
        className={`admin-dashboard__status admin-dashboard__status--${entry.status === "booked" ? "pending" : entry.status === "attended" ? "approved" : "rejected"}`}
      >
        {STATUS_LABEL[entry.status]}
      </span>
      {entry.status === "booked" && (
        <div className="admin-roster__actions">
          <button
            type="button"
            onClick={() => onMark("attended")}
            title="Marcar asistencia"
          >
            <CheckCircle2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMark("no_show")}
            title="Marcar no-show"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onChanged,
}: {
  session: SessionRow;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadRoster() {
    const res = await fetch(`/api/admin/sessions/${session.id}/roster`);
    if (res.ok) setRoster((await res.json()).roster);
  }

  async function toggle() {
    if (!open) await loadRoster();
    setOpen(!open);
  }

  async function mark(bookingId: number, status: "attended" | "no_show") {
    setBusy(true);
    try {
      await fetch(`/api/admin/sessions/${session.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      await loadRoster();
    } finally {
      setBusy(false);
    }
  }

  async function closeAttendance() {
    setBusy(true);
    try {
      await fetch(`/api/admin/sessions/${session.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      await loadRoster();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function cancelSession() {
    if (
      !confirm(
        "¿Cancelar esta clase? Se devuelve el crédito a todos y se avisa por email."
      )
    )
      return;
    setBusy(true);
    try {
      await fetch(`/api/admin/sessions/${session.id}/cancel`, {
        method: "POST",
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-session-card">
      <button
        type="button"
        className="admin-session-card__head"
        onClick={toggle}
      >
        <div>
          <p className="admin-session-card__time">
            {timeOf(session.startsAt)}–{timeOf(session.endsAt)}
            {session.coachName ? ` · ${session.coachName}` : ""}
          </p>
          <p className="admin-session-card__capacity">
            {session.bookedCount}/{session.capacity} cupos
            {session.status === "cancelled" ? " · Cancelada" : ""}
          </p>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="admin-session-card__body">
          {roster === null ? (
            <p className="admin-dashboard__empty">Cargando…</p>
          ) : roster.length === 0 ? (
            <p className="admin-dashboard__empty">Sin reservas todavía.</p>
          ) : (
            roster.map(entry => (
              <RosterRow
                key={entry.bookingId}
                entry={entry}
                onMark={s => mark(entry.bookingId, s)}
              />
            ))
          )}
          {session.status === "scheduled" && (
            <div className="admin-session-card__footer">
              <button
                type="button"
                className="button button--compact"
                onClick={closeAttendance}
                disabled={busy}
              >
                Cerrar asistencia (no marcados → no-show)
              </button>
              <button
                type="button"
                className="button button--compact"
                onClick={cancelSession}
                disabled={busy}
              >
                Cancelar clase completa
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GeneratorPanel({ onGenerated }: { onGenerated: () => void }) {
  const [weeks, setWeeks] = useState(4);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/classes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks }),
      });
      const data = await res.json();
      setNotice(
        res.ok
          ? `${data.created} sesión(es) nueva(s) generadas.`
          : "No se pudo generar."
      );
      if (res.ok) onGenerated();
    } catch {
      setNotice("No se pudo generar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <CalendarPlus size={18} />
        <div>
          <p className="admin-mp__title">Generar clases</p>
          <p className="admin-mp__sub">
            Crea las sesiones de las próximas semanas a partir del horario de
            plantillas. Correrlo dos veces no duplica nada.
          </p>
        </div>
      </div>
      <div className="admin-mp__charge-editor">
        <input
          type="number"
          min={1}
          max={12}
          value={weeks}
          onChange={e => setWeeks(Number(e.target.value))}
          aria-label="Semanas a generar"
        />
        <span>semanas</span>
        <button
          type="button"
          className="button button--cobalt"
          onClick={generate}
          disabled={busy}
        >
          {busy ? "Generando…" : "Generar"}
        </button>
      </div>
      {notice && <p className="admin-mp__notice">{notice}</p>}
    </div>
  );
}

function ClosedDatesPanel({
  closedDates,
  onChanged,
}: {
  closedDates: ClosedDate[];
  onChanged: () => void;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!date) return;
    setBusy(true);
    try {
      await fetch("/api/admin/closed-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason }),
      });
      setDate("");
      setReason("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/admin/closed-dates?id=${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <CalendarX size={18} />
        <div>
          <p className="admin-mp__title">Feriados y vacaciones</p>
          <p className="admin-mp__sub">
            Bloquea una fecha: las sesiones ya generadas para ese día se
            cancelan solas y se avisa por email.
          </p>
        </div>
      </div>
      <div className="admin-mp__charge-editor">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          aria-label="Fecha a bloquear"
        />
        <input
          type="text"
          placeholder="Motivo (opcional)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="button button--cobalt"
          onClick={add}
          disabled={busy || !date}
        >
          Bloquear
        </button>
      </div>
      {closedDates.length > 0 && (
        <ul className="admin-closed-dates">
          {closedDates.map(cd => (
            <li key={cd.id}>
              <span>
                {cd.date} {cd.reason ? `· ${cd.reason}` : ""}
              </span>
              <button
                type="button"
                onClick={() => remove(cd.id)}
                title="Quitar bloqueo"
              >
                <XCircle size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TemplatesPanel({
  templates,
  onChanged,
}: {
  templates: ClassTemplate[];
  onChanged: () => void;
}) {
  async function toggleActive(t: ClassTemplate) {
    await fetch(`/api/admin/classes/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    onChanged();
  }

  const byWeekday = [1, 2, 3, 4, 5, 6, 0]
    .map(w => ({ weekday: w, items: templates.filter(t => t.weekday === w) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="admin-mp">
      <div className="admin-mp__info">
        <div>
          <p className="admin-mp__title">Plantillas de horario</p>
          <p className="admin-mp__sub">
            El horario recurrente del gimnasio. Desactivar una plantilla no
            borra sesiones ya generadas, solo evita que se generen nuevas.
          </p>
        </div>
      </div>
      {byWeekday.map(group => (
        <div key={group.weekday} className="admin-templates__group">
          <p className="admin-templates__weekday">
            {WEEKDAY_NAMES[group.weekday]}
          </p>
          {group.items.map(t => (
            <label key={t.id} className="admin-templates__row">
              <input
                type="checkbox"
                checked={t.active}
                onChange={() => toggleActive(t)}
              />
              <span>
                {t.startTime}–{t.endTime} · {t.capacity} cupos
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ClasesPanel() {
  const [date, setDate] = useState(todayStr());
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDay(d: string) {
    const res = await fetch(`/api/admin/sessions?date=${d}`);
    if (res.ok) setSessions((await res.json()).sessions);
  }

  async function loadTemplates() {
    const res = await fetch("/api/admin/classes/templates");
    if (res.ok) setTemplates((await res.json()).templates);
  }

  async function loadClosedDates() {
    const res = await fetch("/api/admin/closed-dates");
    if (res.ok) setClosedDates((await res.json()).closedDates);
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadDay(date), loadTemplates(), loadClosedDates()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDay(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="admin-classes">
      <GeneratorPanel onGenerated={loadAll} />

      <div className="admin-mp">
        <div className="admin-mp__info">
          <div>
            <p className="admin-mp__title">Vista del día</p>
            <p className="admin-mp__sub">
              Cada clase con su cupo, lista de asistentes y lista de espera.
            </p>
          </div>
        </div>
        <div className="admin-mp__charge-editor">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            aria-label="Fecha a ver"
          />
        </div>
        {loading ? (
          <p className="admin-dashboard__empty">Cargando…</p>
        ) : sessions.length === 0 ? (
          <p className="admin-dashboard__empty">
            No hay clases generadas para este día.
          </p>
        ) : (
          <div className="admin-session-list">
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onChanged={() => loadDay(date)}
              />
            ))}
          </div>
        )}
      </div>

      <ClosedDatesPanel closedDates={closedDates} onChanged={loadClosedDates} />
      <TemplatesPanel templates={templates} onChanged={loadTemplates} />
    </div>
  );
}
