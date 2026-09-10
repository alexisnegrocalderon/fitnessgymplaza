import { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";

type Member = {
  id: number;
  email: string;
  fullName: string;
  whatsapp: string | null;
  audience: "general" | "student";
  studentCertificateStatus:
    | "not_applicable"
    | "pending_verification"
    | "verified";
  createdAt: string;
};

type Membership = {
  id: number;
  tier: string;
  creditsTotal: number;
  creditsUsed: number;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
  ledger: {
    id: number;
    delta: number;
    reason: string;
    note: string | null;
    createdAt: string;
  }[];
};

const CERT_LABEL: Record<Member["studentCertificateStatus"], string> = {
  not_applicable: "—",
  pending_verification: "Por verificar",
  verified: "Verificado",
};

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

function AdjustCreditsForm({
  memberId,
  membershipId,
  onDone,
}: {
  memberId: number;
  membershipId: number;
  onDone: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    const n = Number(delta);
    if (!Number.isInteger(n) || n === 0 || !note.trim()) {
      setNotice("Indica un número de créditos y el motivo.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          creditsDelta: n,
          note: note.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setDelta("");
      setNote("");
      onDone();
    } catch {
      setNotice("No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-credit-adjust">
      <input
        type="number"
        placeholder="+2 o -1"
        value={delta}
        onChange={e => setDelta(e.target.value)}
        aria-label="Créditos a sumar o restar"
      />
      <input
        type="text"
        placeholder="Motivo (obligatorio)"
        value={note}
        onChange={e => setNote(e.target.value)}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="button button--compact"
        onClick={submit}
        disabled={busy}
      >
        Ajustar
      </button>
      {notice && <span className="admin-mp__notice">{notice}</span>}
    </div>
  );
}

function MemberDetail({
  memberId,
  onClose,
  onChanged,
}: {
  memberId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  async function load() {
    const res = await fetch(`/api/admin/members/${memberId}`);
    if (res.ok) {
      const data = await res.json();
      setMember(data.member);
      setMemberships(data.memberships);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  async function setCertStatus(status: Member["studentCertificateStatus"]) {
    await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentCertificateStatus: status }),
    });
    load();
    onChanged();
  }

  if (!member) return <p className="admin-dashboard__empty">Cargando…</p>;

  return (
    <div className="admin-member-detail">
      <button
        type="button"
        className="button button--compact"
        onClick={onClose}
      >
        ← Volver
      </button>
      <h3>{member.fullName}</h3>
      <p className="admin-roster__contact">
        {member.email} · {member.whatsapp}
      </p>

      {member.audience === "student" && (
        <div className="admin-mp__charge-editor">
          <span>Certificado de alumno regular:</span>
          <span>{CERT_LABEL[member.studentCertificateStatus]}</span>
          {member.studentCertificateStatus !== "verified" && (
            <button
              type="button"
              className="button button--compact"
              onClick={() => setCertStatus("verified")}
            >
              Marcar verificado
            </button>
          )}
        </div>
      )}

      <h4>Membresías</h4>
      {memberships.length === 0 ? (
        <p className="admin-dashboard__empty">Sin planes comprados todavía.</p>
      ) : (
        memberships.map(m => (
          <div key={m.id} className="admin-mp" style={{ marginBottom: 12 }}>
            <div className="admin-mp__info">
              <div>
                <p className="admin-mp__title">
                  {m.tier} · {m.creditsTotal - m.creditsUsed}/{m.creditsTotal}{" "}
                  créditos restantes
                </p>
                <p className="admin-mp__sub">
                  Vence el {new Date(m.expiresAt).toLocaleDateString("es-CL")} ·
                  estado {m.status}
                </p>
              </div>
            </div>
            <AdjustCreditsForm
              memberId={memberId}
              membershipId={m.id}
              onDone={() => {
                load();
                onChanged();
              }}
            />
            {m.ledger.length > 0 && (
              <ul className="admin-ledger">
                {m.ledger.slice(0, 8).map(entry => (
                  <li key={entry.id}>
                    {new Date(entry.createdAt).toLocaleDateString("es-CL")} ·{" "}
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta} ({entry.reason})
                    {entry.note ? ` — ${entry.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function AlumnosPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/members");
    if (res.ok) setMembers((await res.json()).members);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (selected !== null) {
    return (
      <MemberDetail
        memberId={selected}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    );
  }

  if (loading) return <p className="admin-dashboard__empty">Cargando…</p>;
  if (members.length === 0)
    return (
      <p className="admin-dashboard__empty">
        Todavía no hay alumnos registrados.
      </p>
    );

  return (
    <div className="admin-dashboard__table-wrap">
      <table className="admin-dashboard__table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Perfil</th>
            <th>Certificado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.fullName}</td>
              <td>
                <a href={`mailto:${m.email}`} className="admin-contact-link">
                  <Mail size={14} /> {m.email}
                </a>
              </td>
              <td>
                {m.whatsapp && (
                  <a
                    href={waLink(m.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-contact-link"
                  >
                    <MessageCircle size={14} /> {m.whatsapp}
                  </a>
                )}
              </td>
              <td>{m.audience === "student" ? "Estudiante" : "General"}</td>
              <td>{CERT_LABEL[m.studentCertificateStatus]}</td>
              <td className="admin-dashboard__actions">
                <button
                  type="button"
                  className="button button--compact"
                  onClick={() => setSelected(m.id)}
                >
                  Ver ficha
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
