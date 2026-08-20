/**
 * Style reminder: Performance Command extends Laboratorio de Movimiento.
 * Graphite is the stage, signal red is the command, and the interface behaves
 * like a training circuit: route, select, reveal, reserve. Use no generic tables.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";

const VIDEO_URL = "/manus-storage/plaza-fitness-hero_d9cbc2e5.mp4";
const MARK_URL = "/manus-storage/plaza-fitness-original-logo_078d76fa.png";
const SPACE_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=88";
const COACHING_IMAGE = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=88";
const SCHEDULE_SOURCE = "/manus-storage/plaza-horarios-oficiales_8bea71ad.jpeg";
const PLANS_SOURCE = "/manus-storage/plaza-valores-oficiales_1600821c.jpeg";
const ENROLLMENT_SOURCE = "/manus-storage/plaza-inscripcion-paso-a-paso_6156b6f1.jpeg";
const POLICIES_SOURCE = "/manus-storage/plaza-reglas-importantes_f8370ed9.jpeg";
const BASE_WHATSAPP = "https://wa.me/56952254029";

type Audience = "general" | "student";

type Plan = {
  id: string;
  audience: Audience;
  label: string;
  price: string;
  credits: number;
  saturdayCredits: number;
  tagline: string;
  note: string;
  studentRequirement?: boolean;
  featured?: boolean;
};

const scheduleGroups = [
  {
    id: "lwmf",
    nav: "L / M / V",
    title: "Lunes, miércoles y viernes",
    label: "Ruta de seis sesiones",
    slots: ["08:30–09:30", "09:30–10:30", "12:00–13:00", "17:00–18:00", "18:00–19:00", "19:00–20:00"],
  },
  {
    id: "tt",
    nav: "M / J",
    title: "Martes y jueves",
    label: "Ruta de seis sesiones",
    slots: ["08:30–09:30", "09:30–10:30", "12:00–13:00", "18:00–19:00", "19:00–20:00", "20:00–21:00"],
  },
  {
    id: "sat",
    nav: "SÁB",
    title: "Sábados",
    label: "Sesiones de regalo",
    slots: ["09:30–10:30", "10:30–11:30"],
  },
];

const plans: Plan[] = [
  {
    id: "general-single",
    audience: "general",
    label: "Clase única",
    price: "$8.000",
    credits: 1,
    saturdayCredits: 0,
    tagline: "Conoce el circuito",
    note: "Una sesión para probar el ritmo, la guía técnica y el formato de Plaza Fitness.",
  },
  {
    id: "general-8",
    audience: "general",
    label: "Base 8",
    price: "$45.000",
    credits: 8,
    saturdayCredits: 4,
    tagline: "Construye constancia",
    note: "Ocho créditos para avanzar durante el mes más cuatro sábados de regalo.",
    featured: true,
  },
  {
    id: "general-12",
    audience: "general",
    label: "Progresión 12",
    price: "$60.000",
    credits: 12,
    saturdayCredits: 4,
    tagline: "Más pulso, más progreso",
    note: "Doce créditos para sostener una frecuencia alta más cuatro sábados de regalo.",
  },
  {
    id: "student-single",
    audience: "student",
    label: "Clase única",
    price: "$6.000",
    credits: 1,
    saturdayCredits: 0,
    tagline: "Acceso estudiante",
    note: "Una sesión con tarifa estudiante. Se solicita certificado de alumno regular.",
    studentRequirement: true,
  },
  {
    id: "student-8",
    audience: "student",
    label: "Base 8",
    price: "$36.000",
    credits: 8,
    saturdayCredits: 4,
    tagline: "Ritmo estudiante",
    note: "Ocho créditos y cuatro sábados de regalo con tarifa estudiante vigente.",
    studentRequirement: true,
    featured: true,
  },
  {
    id: "student-12",
    audience: "student",
    label: "Progresión 12",
    price: "$46.000",
    credits: 12,
    saturdayCredits: 4,
    tagline: "Sostén el hábito",
    note: "Doce créditos y cuatro sábados de regalo con tarifa estudiante vigente.",
    studentRequirement: true,
  },
];

const method = [
  { id: "01", title: "Guía técnica", text: "Profesores presentes en cada estación para enseñar el ejercicio y cuidar la postura correcta." },
  { id: "02", title: "Carga adaptada", text: "Cada estímulo se ajusta a tu nivel, capacidades y punto de partida sin perder intención." },
  { id: "03", title: "Movimiento integral", text: "Entrenamos fuerza, capacidad cardiovascular, movilidad y control para una vida más activa." },
];

const policies = [
  { id: "01", metric: "30 días", title: "Ventana de reserva", text: "Puedes reservar tus clases con hasta 30 días de anticipación.", icon: CalendarDays },
  { id: "02", metric: "30 min", title: "Cierre de reserva", text: "La reserva queda disponible hasta 30 minutos antes del inicio de la clase.", icon: Clock3 },
  { id: "03", metric: "2 horas", title: "Cancela sin perder crédito", text: "Para eliminar una clase sin consumir tu crédito, debes hacerlo con dos horas de anticipación.", icon: TimerReset },
  { id: "04", metric: "Jueves 22:30", title: "Activación de regalo", text: "La clase de regalo se activa los jueves a las 22:30 horas para usar según el horario vigente.", icon: BellRing },
  { id: "05", metric: "Sábados", title: "Créditos de regalo", text: "Los packs de 8 y 12 clases incluyen cuatro sábados de regalo según programación vigente.", icon: Gift },
  { id: "06", metric: "Certificado", title: "Pausa de plan", text: "Puedes pausar tu plan presentando certificado médico al equipo de Plaza Fitness.", icon: Stethoscope },
];

const transferData = [
  ["Titular", "Deportes Plaza Fitness Limitada"],
  ["RUT", "77.603.706-0"],
  ["Banco", "Banco de Chile"],
  ["Tipo", "Cuenta Corriente"],
  ["Cuenta", "00-535-05830-06"],
  ["Comprobante", "plazafitnesschile@gmail.com"],
];

function buildWhatsappLink(message: string) {
  return `${BASE_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function BrandMark({ className = "", decorative = false }: { className?: string; decorative?: boolean }) {
  return <img src={MARK_URL} alt={decorative ? "" : "Plaza Fitness"} aria-hidden={decorative ? true : undefined} className={`brand-mark ${className}`} />;
}

function SectionTag({ children, light = false }: { children: string; light?: boolean }) {
  return <div className={`section-tag ${light ? "section-tag--light" : ""}`}><span className="section-tag__line" /><span>{children}</span></div>;
}

function WhatsAppButton({ compact = false, message }: { compact?: boolean; message?: string }) {
  return (
    <a href={buildWhatsappLink(message ?? "Hola Plaza Fitness, quiero conocer los planes, horarios y proceso de inscripción.")} target="_blank" rel="noreferrer" className={`button button--signal ${compact ? "button--compact" : ""}`}>
      <MessageCircle size={compact ? 16 : 18} strokeWidth={2.2} />
      <span>{compact ? "WhatsApp" : "Conversemos"}</span>
      <ArrowUpRight size={16} />
    </a>
  );
}

function PlanPerspectiveCard({ plan, revealed, active, onReveal, onSelect }: { plan: Plan; revealed: boolean; active: boolean; onReveal: () => void; onSelect: () => void }) {
  const planMessage = `Hola Plaza Fitness, quiero inscribirme al ${plan.label} ${plan.audience === "student" ? "para estudiantes" : "general"} (${plan.price}). ¿Me indican disponibilidad y siguientes pasos?`;
  return (
    <article className={`plan-perspective ${revealed ? "is-revealed" : ""} ${active ? "is-active" : ""}`} aria-label={`${plan.label} ${plan.audience === "student" ? "estudiante" : "general"}`}>
      <div className="plan-perspective__surface">
        <div className="plan-perspective__face plan-perspective__front">
          <div className="plan-perspective__meta"><span>{plan.audience === "student" ? "Estudiantes" : "General"}</span>{plan.featured && <b>Más elegido</b>}</div>
          <div className="plan-perspective__number">{String(plan.credits).padStart(2, "0")}</div>
          <div className="plan-perspective__body">
            <span className="plan-perspective__eyebrow">{plan.tagline}</span>
            <h3>{plan.label}</h3>
            <strong className="plan-perspective__price">{plan.price}</strong>
            <p>{plan.note}</p>
          </div>
          <div className="plan-perspective__front-foot">
            <span>{plan.credits} crédito{plan.credits === 1 ? "" : "s"}</span>
            <button type="button" className="reveal-button" onClick={onReveal} aria-expanded={revealed}>
              Ver perspectiva <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="plan-perspective__face plan-perspective__back">
          <button type="button" className="plan-perspective__close" onClick={onReveal} aria-label={`Cerrar detalle ${plan.label}`}><X size={17} /></button>
          <span className="plan-perspective__eyebrow">Créditos conectados</span>
          <h3>{plan.label}</h3>
          <div className="credit-breakdown">
            <div><strong>{plan.credits}</strong><span>clase{plan.credits === 1 ? "" : "s"}</span></div>
            <div><strong>{plan.saturdayCredits}</strong><span>sábados de regalo</span></div>
          </div>
          <ul className="plan-perspective__checks">
            <li><Check size={16} /> Reserva tus clases desde la aplicación.</li>
            <li><Check size={16} /> Horarios disponibles por hasta 30 días.</li>
            {plan.studentRequirement && <li><Check size={16} /> Requiere certificado de alumno regular.</li>}
          </ul>
          <a href={buildWhatsappLink(planMessage)} target="_blank" rel="noreferrer" className="plan-select-button" onClick={onSelect}>Elegir este plan <ArrowUpRight size={16} /></a>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [audience, setAudience] = useState<Audience>("general");
  const [activeSchedule, setActiveSchedule] = useState("lwmf");
  const [activePlanId, setActivePlanId] = useState("general-8");
  const [revealedPlan, setRevealedPlan] = useState<string | null>(null);
  const [openPolicy, setOpenPolicy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 48);
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentSchedule = scheduleGroups.find((group) => group.id === activeSchedule) ?? scheduleGroups[0];
  const audiencePlans = useMemo(() => plans.filter((plan) => plan.audience === audience), [audience]);
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[1];

  const chooseAudience = (nextAudience: Audience) => {
    setAudience(nextAudience);
    setActivePlanId(nextAudience === "general" ? "general-8" : "student-8");
    setRevealedPlan(null);
  };

  const choosePlan = (plan: Plan) => {
    setActivePlanId(plan.id);
    setAudience(plan.audience);
  };

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied("Revisa el dato");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio"><BrandMark className="brand-mark--header" /></a>
        <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navegación principal">
          <a href="#metodo" onClick={closeMenu}>Método</a>
          <a href="#horarios" onClick={closeMenu}>Horarios</a>
          <a href="#planes" onClick={closeMenu}>Planes</a>
          <a href="#inscripcion" onClick={closeMenu}>Inscripción</a>
          <a href="#contacto" onClick={closeMenu}>Contacto</a>
          <div className="site-nav__mobile-cta"><WhatsAppButton compact /></div>
        </nav>
        <div className="site-header__actions">
          <a className="header-phone" href="tel:+56952254029"><Phone size={15} /><span>9 5225 4029</span></a>
          <WhatsAppButton compact />
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-section__media" style={{ transform: `translateY(${scrollY * 0.08}px)` }}><video autoPlay muted loop playsInline poster={SPACE_IMAGE} aria-label="Entrenamiento funcional en Plaza Fitness"><source src={VIDEO_URL} type="video/mp4" /></video></div>
          <div className="hero-section__veil" />
          <div className="hero-section__grid" aria-hidden="true" />
          <div className="hero-section__orb hero-section__orb--one" style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0)` }} />
          <div className="hero-content container">
            <div className="hero-content__topline"><span>VIÑA DEL MAR · CHILE</span><span className="hero-content__topline-rule" /><span>CALLE QUILLOTA 656</span></div>
            <div className="hero-content__main">
              <div className="hero-content__eyebrow"><CalendarDays size={14} /> Horarios, créditos y reserva.</div>
              <h1>Entrena como si<span>importara.</span></h1>
              <p className="hero-content__lede">Entrenamiento funcional dinámico, guiado y adaptado a tu nivel para que moverte mejor se convierta en una práctica que puedas sostener.</p>
              <div className="hero-content__actions"><WhatsAppButton /><a href="#horarios" className="text-link text-link--light">Ver horarios <ArrowRight size={16} /></a></div>
            </div>
            <div className="hero-content__bottomline">
              <div className="hero-stat glass-card"><span className="hero-stat__value">30</span><span className="hero-stat__label">DÍAS PARA<br /><small>reservar clases</small></span></div>
              <div className="hero-scroll"><span>SCROLL TO TRAIN</span><ChevronDown size={16} /></div>
              <div className="hero-stamp"><BrandMark className="brand-mark--stamp" /></div>
            </div>
          </div>
        </section>

        <section id="metodo" className="manifesto-section section-dark">
          <div className="manifesto-section__blueprint" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>
          <div className="container manifesto-layout">
            <div className="manifesto-layout__aside"><SectionTag light>Centro de entrenamiento</SectionTag><div className="vertical-note">GUÍA / POSTURA / PROGRESIÓN</div></div>
            <div className="manifesto-layout__content">
              <h2>No vienes a<span>repetir</span>por repetir.</h2>
              <p className="manifesto-lede">En Plaza Fitness cada clase de entrenamiento funcional trabaja el cuerpo de forma global. Buscamos mejorar o mantener tus capacidades respiratorias, cardiovasculares, musculares y articulares para que te mantengas activo, sano y con mejor control de tu movimiento.</p>
              <div className="method-list">{method.map((item) => <div className="method-item" key={item.id}><span className="method-item__number">{item.id}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={18} /></div>)}</div>
            </div>
          </div>
        </section>

        <section className="space-section section-bone">
          <div className="space-section__wash" aria-hidden="true" />
          <div className="section-meter" aria-hidden="true"><span>02 / 06</span><i /><span>SPACE / QUILLOTA 656</span></div>
          <div className="container space-layout">
            <div className="space-layout__copy"><SectionTag>La reinauguración</SectionTag><h2>Más espacio.<br /><em>Más posibilidades.</em></h2><p>Un gimnasio remodelado para entrenar con más fluidez, acompañamiento real y equipamiento listo para tu siguiente etapa.</p><div className="space-details"><div><span>01</span><strong>Nuevo equipamiento</strong></div><div><span>02</span><strong>Profesores por estación</strong></div><div><span>03</span><strong>Clases dinámicas y adaptadas</strong></div></div><a href="#horarios" className="text-link">Entrena según tu ritmo <ArrowRight size={16} /></a></div>
            <div className="space-layout__visual"><div className="image-frame image-frame--large"><img src={SPACE_IMAGE} alt="Interior de Plaza Fitness con equipamiento funcional" loading="lazy" /><div className="image-frame__caption"><span>CALLE QUILLOTA 656</span><span>VIÑA DEL MAR</span></div></div><div className="image-note glass-card glass-card--bone"><ShieldCheck size={22} /><span>Entrena con<br /><strong>guía real.</strong></span></div></div>
          </div>
        </section>

        <section id="horarios" className="pulse-section section-dark">
          <div className="pulse-section__grid" aria-hidden="true" />
          <div className="section-meter section-meter--light" aria-hidden="true"><span>03 / 06</span><i /><span>PULSE GRID / SEMANAL</span></div>
          <div className="container pulse-section__head"><div><SectionTag light>Horarios Plaza Fitness</SectionTag><h2>Encuentra<br /><em>tu pulso.</em></h2></div><div className="pulse-section__signature"><BrandMark className="brand-mark--pulse" decorative /><p>Elige tu ruta semanal y reserva la franja que mejor calza con tu ritmo. Cada sesión se conecta a los créditos de tu plan.</p></div></div>
          <div className="container pulse-command">
            <div className="pulse-command__controls" role="tablist" aria-label="Rutas semanales">{scheduleGroups.map((group, index) => <button key={group.id} type="button" role="tab" aria-selected={activeSchedule === group.id} className={activeSchedule === group.id ? "is-active" : ""} onClick={() => setActiveSchedule(group.id)}><span>0{index + 1}</span><strong>{group.nav}</strong><small>{group.id === "sat" ? "regalo" : "sesiones"}</small></button>)}</div>
            <div className="pulse-command__display" role="tabpanel">
              <div className="pulse-command__display-head"><div><span className="pulse-command__serial">ROUTE / {currentSchedule.id.toUpperCase()}</span><h3>{currentSchedule.title}</h3></div><div className="pulse-command__count"><strong>{currentSchedule.slots.length}</strong><span>sesiones<br />disponibles</span></div></div>
              <div className="time-rail" aria-label={`Horarios ${currentSchedule.title}`}>{currentSchedule.slots.map((slot, index) => <a key={slot} className="time-node" href={buildWhatsappLink(`Hola Plaza Fitness, quiero reservar la sesión ${slot} de ${currentSchedule.title}. Tengo el plan ${activePlan.label}.`)} target="_blank" rel="noreferrer"><span className="time-node__index">{String(index + 1).padStart(2, "0")}</span><span className="time-node__pulse" /><strong>{slot}</strong><small>Reservar</small></a>)}</div>
              <div className="schedule-credit-bridge"><div><span>PLAN CONECTADO</span><strong>{activePlan.label} · {activePlan.audience === "student" ? "Estudiantes" : "General"}</strong></div><div className="schedule-credit-bridge__meter"><b>{activePlan.credits}</b><span>créditos de clase</span>{activePlan.saturdayCredits > 0 && <em>+ {activePlan.saturdayCredits} sábados</em>}</div><a href="#planes">Cambiar plan <ArrowRight size={15} /></a></div>
            </div>
          </div>
          <div className="container pulse-section__foot"><Gift size={19} /><span>Los packs de 8 y 12 clases incluyen 4 sábados de regalo según programación vigente.</span><a href="#planes">Ver planes <ArrowRight size={16} /></a></div>
        </section>

        <section id="planes" className="plans-command-section section-bone">
          <div className="section-meter" aria-hidden="true"><span>04 / 06</span><i /><span>PLAN / CREDITS / REVEAL</span></div>
          <div className="container plans-command-section__head"><div><SectionTag>Elige tu plan</SectionTag><h2>Activa tus<br /><em>créditos.</em></h2></div><p>Las tarjetas se abren en perspectiva para mostrar exactamente qué créditos, beneficios y condiciones activas con cada elección.</p></div>
          <div className="container audience-switch" role="group" aria-label="Elegir tipo de plan"><button type="button" className={audience === "general" ? "is-active" : ""} onClick={() => chooseAudience("general")}><span>01</span>Planes generales</button><button type="button" className={audience === "student" ? "is-active" : ""} onClick={() => chooseAudience("student")}><span>02</span>Planes estudiantes</button></div>
          <div className="plans-perspective-track" role="region" aria-label="Planes de entrenamiento con detalle interactivo"><div className="plans-perspective-track__inner">{audiencePlans.map((plan) => <PlanPerspectiveCard key={plan.id} plan={plan} active={activePlanId === plan.id} revealed={revealedPlan === plan.id} onReveal={() => setRevealedPlan((current) => current === plan.id ? null : plan.id)} onSelect={() => choosePlan(plan)} />)}</div></div>
          <div className="container plans-command-section__foot"><span><strong>Perspective Reveal</strong> · toca cada tarjeta para girar y ver sus créditos.</span><a href="#horarios" className="text-link">Llevar créditos al horario <ArrowRight size={16} /></a></div>
        </section>

        <section id="inscripcion" className="enrollment-section section-dark">
          <div className="section-meter section-meter--light" aria-hidden="true"><span>05 / 06</span><i /><span>STEP / PAY / RESERVE</span></div>
          <div className="container enrollment-section__head"><div><SectionTag light>Activa tu plan</SectionTag><h2>Paso a<br /><span>paso.</span></h2></div><p>Una vez que eliges tu plan, seguimos una ruta clara: envías tus datos, realizas la transferencia y recibes acceso a la aplicación de reservas.</p></div>
          <div className="container enrollment-grid">
            <div className="enrollment-steps"><article><span>01</span><div><UserRound size={21} /><h3>Envía tus datos</h3><p>Nombre completo, email, RUT y comprobante de pago. Para tarifa estudiante, adjunta certificado de alumno regular.</p></div></article><article><span>02</span><div><CreditCard size={21} /><h3>Transfiere tu plan</h3><p>Usa los datos bancarios publicados, guarda el comprobante y envíalo al correo de Plaza Fitness.</p></div></article><article><span>03</span><div><ClipboardCheck size={21} /><h3>Reserva tus sesiones</h3><p>Recibirás por correo tu usuario y contraseña para acceder a la aplicación y reservar tus clases.</p></div></article></div>
            <aside className="transfer-command"><div className="transfer-command__head"><div><span>TRANSFERENCIA</span><h3>Datos de pago</h3></div><CreditCard size={22} /></div><div className="transfer-command__data">{transferData.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><button type="button" aria-label={`Copiar ${label}`} onClick={() => copyValue(label, value)}>{copied === label ? <Check size={15} /> : <Copy size={15} />}</button></div>)}</div><div className="transfer-command__foot"><Mail size={16} /><span>Envía el comprobante a <strong>plazafitnesschile@gmail.com</strong></span></div><WhatsAppButton compact message={`Hola Plaza Fitness, elegí el ${activePlan.label}. Quiero enviar mis datos y comprobante para activar mi plan.`} /></aside>
          </div>
          <div className="container official-sources"><details><summary><span>Información oficial</span><strong>Ver guía de inscripción <ChevronDown size={16} /></strong></summary><img src={ENROLLMENT_SOURCE} alt="Gráfica informativa de inscripción y transferencia de Plaza Fitness" loading="lazy" /></details><details><summary><span>Información oficial</span><strong>Ver valores publicados <ChevronDown size={16} /></strong></summary><img src={PLANS_SOURCE} alt="Gráfica informativa de valores de Plaza Fitness" loading="lazy" /></details></div>
        </section>

        <section className="rules-section section-bone">
          <div className="section-meter" aria-hidden="true"><span>06 / 06</span><i /><span>RULES / BENEFITS / CONTROL</span></div>
          <div className="container rules-section__head"><div><SectionTag>Reglas de la pista</SectionTag><h2>Entrena con<br /><em>claridad.</em></h2></div><p>Estas reglas cuidan tus créditos, hacen que los cupos se usen bien y mantienen la experiencia lista para todos.</p></div>
          <div className="container policy-grid">{policies.map((policy) => { const Icon = policy.icon; const open = openPolicy === policy.id; return <article className={open ? "is-open" : ""} key={policy.id}><button type="button" onClick={() => setOpenPolicy(open ? null : policy.id)} aria-expanded={open}><span className="policy-grid__icon"><Icon size={21} /></span><span className="policy-grid__metric">{policy.metric}</span><ChevronRight className="policy-grid__arrow" size={18} /></button><div className="policy-grid__content"><h3>{policy.title}</h3><p>{policy.text}</p></div></article>; })}</div>
          <div className="container rules-source"><details><summary><span>Ver pieza informativa original</span><ChevronDown size={17} /></summary><img src={POLICIES_SOURCE} alt="Gráfica de reglas e información importante de Plaza Fitness" loading="lazy" /></details><details><summary><span>Ver horarios oficiales publicados</span><ChevronDown size={17} /></summary><img src={SCHEDULE_SOURCE} alt="Gráfica de horarios oficiales de Plaza Fitness" loading="lazy" /></details></div>
        </section>

        <section id="contacto" className="contact-section section-dark">
          <div className="contact-section__mark" aria-hidden="true"><BrandMark className="brand-mark--contact" decorative /></div>
          <div className="container contact-layout"><div className="contact-layout__main"><SectionTag light>Da el siguiente paso</SectionTag><h2>Nos vemos<br /><em>en la pista.</em></h2><p>Escríbenos para confirmar tu plan, activar tu acceso y encontrar el horario que calza contigo.</p><WhatsAppButton /></div><div className="contact-layout__details"><div className="contact-detail"><MapPin size={20} /><div><span>Encuéntranos</span><strong>Calle Quillota 656<br />Viña del Mar, Valparaíso</strong></div></div><div className="contact-detail"><Clock3 size={20} /><div><span>Horarios</span><strong>Reserva hasta 30 días<br />antes de tu clase</strong></div></div><div className="contact-detail"><Phone size={20} /><div><span>WhatsApp</span><strong>+56 9 5225 4029</strong></div></div></div></div>
          <div className="contact-section__marquee" aria-hidden="true"><span>PLAZA FITNESS · CALLE QUILLOTA 656 · VIÑA DEL MAR · </span><span>PLAZA FITNESS · CALLE QUILLOTA 656 · VIÑA DEL MAR · </span></div>
        </section>
      </main>

      <footer className="site-footer section-dark"><div className="container site-footer__inner"><a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio"><BrandMark className="brand-mark--footer" /></a><span className="site-footer__copy">© 2026 Plaza Fitness · Calle Quillota 656 · Viña del Mar</span><div className="site-footer__links"><a href={buildWhatsappLink("Hola Plaza Fitness, quiero información.")} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href="#inicio"><Instagram size={15} /> Instagram</a></div></div></footer>
    </div>
  );
}
