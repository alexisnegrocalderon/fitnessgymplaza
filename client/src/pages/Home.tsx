/**
 * Style reminder: Performance Command / Functional Pulse.
 * The interface must feel like a guided functional-training session: direct,
 * physical and responsive. Red is a command signal; motion is purposeful.
 */
import { useEffect, useMemo, useRef, useState } from "react";
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
  Pause,
  Phone,
  Play,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const VIDEO_URL = "/manus-storage/plaza-fitness-hero_d9cbc2e5.mp4";
const MARK_URL = "/manus-storage/plaza-fitness-original-logo_078d76fa.png";
const SPACE_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=88";
const SCHEDULE_SOURCE = "/manus-storage/plaza-horarios-oficiales_8bea71ad.jpeg";
const ENROLLMENT_SOURCE = "/manus-storage/plaza-inscripcion-paso-a-paso_6156b6f1.jpeg";
const POLICIES_SOURCE = "/manus-storage/plaza-reglas-importantes_f8370ed9.jpeg";
const BASE_WHATSAPP = "https://wa.me/56952254029";

type Audience = "general" | "student";

type Plan = {
  id: string;
  audience: Audience;
  label: string;
  price: string;
  tagline: string;
  note: string;
  cadence: string;
  featured?: boolean;
  studentRequirement?: boolean;
};

const scheduleGroups = [
  {
    id: "lwmf",
    badge: "01",
    nav: "L / M / V",
    title: "Tu semana en marcha",
    days: "Lunes, miércoles y viernes",
    brief: "Seis oportunidades para instalar una frecuencia que se siente en tu cuerpo.",
    slots: ["08:30–09:30", "09:30–10:30", "12:00–13:00", "17:00–18:00", "18:00–19:00", "19:00–20:00"],
  },
  {
    id: "tt",
    badge: "02",
    nav: "M / J",
    title: "Tu ritmo intercalado",
    days: "Martes y jueves",
    brief: "Una ruta compacta para volver, recuperar y progresar sin desconectarte.",
    slots: ["08:30–09:30", "09:30–10:30", "12:00–13:00", "18:00–19:00", "19:00–20:00", "20:00–21:00"],
  },
  {
    id: "sat",
    badge: "03",
    nav: "SÁB",
    title: "Activa tu sábado",
    days: "Sábado",
    brief: "Dos sesiones para abrir el fin de semana con energía y técnica.",
    slots: ["09:30–10:30", "10:30–11:30"],
  },
];

const plans: Plan[] = [
  { id: "general-single", audience: "general", label: "Clase única", price: "$8.000", tagline: "Conoce el circuito", note: "Una sesión para probar el ritmo, la guía técnica y el formato de Plaza Fitness.", cadence: "Ideal para una primera experiencia." },
  { id: "general-8", audience: "general", label: "Base 8", price: "$45.000", tagline: "Construye constancia", note: "Un formato pensado para convertir el entrenamiento en una práctica semanal sostenible.", cadence: "Frecuencia sugerida: 2 veces por semana.", featured: true },
  { id: "general-12", audience: "general", label: "Progresión 12", price: "$60.000", tagline: "Más pulso, más progreso", note: "Mayor presencia en la semana para profundizar técnica, capacidad y consistencia.", cadence: "Frecuencia sugerida: 3 veces por semana." },
  { id: "student-single", audience: "student", label: "Clase única", price: "$6.000", tagline: "Acceso estudiante", note: "Una sesión con tarifa estudiante para conocer la dinámica del gimnasio.", cadence: "Requiere certificado de alumno regular.", studentRequirement: true },
  { id: "student-8", audience: "student", label: "Base 8", price: "$36.000", tagline: "Ritmo estudiante", note: "Una alternativa diseñada para sostener movimiento, estudio y bienestar en paralelo.", cadence: "Requiere certificado de alumno regular.", featured: true, studentRequirement: true },
  { id: "student-12", audience: "student", label: "Progresión 12", price: "$46.000", tagline: "Sostén el hábito", note: "Más presencia para acompañar tu condición física durante el semestre.", cadence: "Requiere certificado de alumno regular.", studentRequirement: true },
];

const method = [
  { id: "01", title: "Profesores en cada estación", text: "Acompañamiento presente para enseñar cada ejercicio y mantener la intención de la sesión." },
  { id: "02", title: "Técnica y postura", text: "Correcciones oportunas para moverte con mayor seguridad, control y conciencia corporal." },
  { id: "03", title: "Nivel adaptado a ti", text: "Cada estímulo se ajusta a tus capacidades, experiencia y condición actual." },
  { id: "04", title: "Entrenamiento global", text: "Trabajamos grupos musculares de forma integrada, no aislada, para un cuerpo más funcional." },
  { id: "05", title: "Capacidad cardiovascular", text: "Desarrollamos resistencia respiratoria y cardiovascular para sostener mejor el esfuerzo diario." },
  { id: "06", title: "Fuerza y movilidad", text: "Potenciamos músculos y articulaciones para ganar movimiento útil, estable y disponible." },
  { id: "07", title: "Salud activa", text: "Una práctica para mejorar o mantener tu condición física y composición corporal a largo plazo." },
];

const policies = [
  { metric: "30 días", title: "Planifica con tiempo", text: "Puedes organizar tus clases con hasta 30 días de anticipación.", icon: CalendarDays },
  { metric: "30 min", title: "Cierre de reserva", text: "La inscripción para una clase permanece disponible hasta 30 minutos antes de comenzar.", icon: Clock3 },
  { metric: "2 horas", title: "Cancela con margen", text: "Cancela con dos horas de anticipación para que otro alumno pueda tomar ese espacio.", icon: TimerReset },
  { metric: "Jueves 22:30", title: "Actualización semanal", text: "Revisa el horario de fin de semana desde el jueves a las 22:30 horas.", icon: BellRing },
  { metric: "Sábados", title: "Sesiones especiales", text: "Consulta directamente con el equipo la programación vigente para los sábados.", icon: Gift },
  { metric: "Certificado", title: "Pausa tu plan", text: "Si necesitas una pausa, el equipo evalúa tu solicitud con certificado médico.", icon: Stethoscope },
];

const transferData = [
  ["Titular", "Deportes Plaza Fitness Limitada"],
  ["RUT", "77.603.706-0"],
  ["Banco", "Banco de Chile"],
  ["Tipo", "Cuenta Corriente"],
  ["Cuenta", "00-535-05830-06"],
  ["Comprobante", "plazafitnesschile@gmail.com"],
];

const timerSegments = [
  { label: "READY", caption: "Prepara tu estación", seconds: 5, tone: "ready" },
  { label: "MOVE", caption: "Trabajo en marcha", seconds: 20, tone: "move" },
  { label: "RESET", caption: "Recupera y respira", seconds: 10, tone: "reset" },
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
  return <a href={buildWhatsappLink(message ?? "Hola Plaza Fitness, quiero conocer los planes y horarios disponibles.")} target="_blank" rel="noreferrer" className={`button button--signal ${compact ? "button--compact" : ""}`}><MessageCircle size={compact ? 16 : 18} strokeWidth={2.2} /><span>{compact ? "WhatsApp" : "Conversemos"}</span><ArrowUpRight size={16} /></a>;
}

function PlanPerspectiveCard({ plan, revealed, onReveal, onStart }: { plan: Plan; revealed: boolean; onReveal: () => void; onStart: () => void }) {
  return (
    <article className={`plan-perspective reveal-on-scroll ${revealed ? "is-revealed" : ""}`} aria-label={`${plan.label} ${plan.audience === "student" ? "estudiante" : "general"}`}>
      <div className="plan-perspective__surface">
        <div className="plan-perspective__face plan-perspective__front">
          <div className="plan-perspective__meta"><span>{plan.audience === "student" ? "Estudiantes" : "General"}</span>{plan.featured && <b>Más elegido</b>}</div>
          <div className="plan-perspective__number">{plan.label.match(/\d+/)?.[0] ?? "01"}</div>
          <div className="plan-perspective__body"><span className="plan-perspective__eyebrow">{plan.tagline}</span><h3>{plan.label}</h3><strong className="plan-perspective__price">{plan.price}</strong><p>{plan.note}</p></div>
          <div className="plan-perspective__front-foot"><span>Plan mensual</span><button type="button" className="reveal-button" onClick={onReveal} aria-expanded={revealed}>Ver perspectiva <ChevronRight size={16} /></button></div>
        </div>
        <div className="plan-perspective__face plan-perspective__back">
          <button type="button" className="plan-perspective__close" onClick={onReveal} aria-label={`Cerrar detalle ${plan.label}`}><X size={17} /></button>
          <span className="plan-perspective__eyebrow">Tu ritmo</span><h3>{plan.label}</h3>
          <div className="plan-rhythm"><span>PLAZA FITNESS</span><strong>{plan.cadence}</strong></div>
          <ul className="plan-perspective__checks"><li><Check size={16} /> Entrenamiento funcional guiado.</li><li><Check size={16} /> Profesores presentes por estación.</li><li><Check size={16} /> Horarios para elegir según tu rutina.</li>{plan.studentRequirement && <li><Check size={16} /> Presenta certificado de alumno regular.</li>}</ul>
          <button type="button" className="plan-select-button" onClick={onStart}>Continuar inscripción <ArrowUpRight size={16} /></button>
        </div>
      </div>
    </article>
  );
}

function EnrollmentModal({ plan, onClose, copyValue, copied }: { plan: Plan; onClose: () => void; copyValue: (label: string, value: string) => void; copied: string | null }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="enrollment-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="enrollment-modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button ref={closeButtonRef} className="enrollment-modal__close" type="button" onClick={onClose} aria-label="Cerrar inscripción"><X size={20} /></button>
        <div className="enrollment-modal__glow" aria-hidden="true" />
        <div className="enrollment-modal__header"><SectionTag light>Inscripción Plaza Fitness</SectionTag><h2 id="modal-title">Activa<br /><span>{plan.label}.</span></h2><p>Elegiste <strong>{plan.label}</strong> {plan.audience === "student" ? "con tarifa estudiante" : "para público general"}. Sigue estos pasos y el equipo te ayudará a comenzar.</p></div>
        <div className="enrollment-modal__grid">
          <div className="modal-steps"><article><span>01</span><div><UserRound size={20} /><h3>Envía tus datos</h3><p>Nombre completo, email, RUT y comprobante de pago.{plan.studentRequirement ? " Adjunta también tu certificado de alumno regular." : ""}</p></div></article><article><span>02</span><div><CreditCard size={20} /><h3>Transfiere tu plan</h3><p>Realiza la transferencia con los datos publicados y guarda tu comprobante.</p></div></article><article><span>03</span><div><ClipboardCheck size={20} /><h3>Recibe tu acceso</h3><p>El equipo te enviará la información necesaria para coordinar tus primeras sesiones.</p></div></article></div>
          <aside className="modal-transfer"><div className="modal-transfer__head"><div><span>TRANSFERENCIA</span><h3>{plan.price}</h3></div><CreditCard size={22} /></div><div className="transfer-command__data">{transferData.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><button type="button" aria-label={`Copiar ${label}`} onClick={() => copyValue(label, value)}>{copied === label ? <Check size={15} /> : <Copy size={15} />}</button></div>)}</div><div className="transfer-command__foot"><Mail size={16} /><span>Envía el comprobante a <strong>plazafitnesschile@gmail.com</strong></span></div><a href={buildWhatsappLink(`Hola Plaza Fitness, quiero activar el plan ${plan.label} (${plan.price}). Ya tengo mis datos y necesito los siguientes pasos.`)} target="_blank" rel="noreferrer" className="button button--signal">Continuar por WhatsApp <ArrowUpRight size={16} /></a></aside>
        </div>
        <details className="enrollment-modal__source"><summary>Ver guía de inscripción oficial <ChevronDown size={16} /></summary><img src={ENROLLMENT_SOURCE} alt="Guía oficial de inscripción y transferencia de Plaza Fitness" /></details>
      </section>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [audience, setAudience] = useState<Audience>("general");
  const [activeSchedule, setActiveSchedule] = useState("lwmf");
  const [revealedPlan, setRevealedPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSound, setTimerSound] = useState(false);
  const [timerIndex, setTimerIndex] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(timerSegments[0].seconds);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleScroll = () => { setScrolled(window.scrollY > 48); setScrollY(window.scrollY); };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("motion-ready");
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    if (!window.IntersectionObserver) { elements.forEach((element) => element.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(selectedPlan));
    return () => document.body.classList.remove("modal-open");
  }, [selectedPlan]);

  const cue = () => {
    if (!timerSound) return;
    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.13);
  };

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerRemaining((remaining) => {
        if (remaining > 1) return remaining - 1;
        const nextIndex = (timerIndex + 1) % timerSegments.length;
        setTimerIndex(nextIndex);
        cue();
        return timerSegments[nextIndex].seconds;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerIndex, timerSound]);

  const currentSchedule = scheduleGroups.find((group) => group.id === activeSchedule) ?? scheduleGroups[0];
  const audiencePlans = useMemo(() => plans.filter((plan) => plan.audience === audience), [audience]);
  const timerSegment = timerSegments[timerIndex];
  const timerProgress = ((timerSegment.seconds - timerRemaining) / timerSegment.seconds) * 100;

  const copyValue = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(null), 1600); } catch { setCopied("Revisa el dato"); }
  };
  const closeMenu = () => setMenuOpen(false);
  const openEnrollment = (plan: Plan) => { setSelectedPlan(plan); setRevealedPlan(null); };
  const resetTimer = () => { setTimerRunning(false); setTimerIndex(0); setTimerRemaining(timerSegments[0].seconds); };

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio"><BrandMark className="brand-mark--header" /></a>
        <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navegación principal"><a href="#metodo" onClick={closeMenu}>Método</a><a href="#horarios" onClick={closeMenu}>Horarios</a><a href="#planes" onClick={closeMenu}>Planes</a><a href="#reglas" onClick={closeMenu}>Reglas</a><a href="#contacto" onClick={closeMenu}>Contacto</a><div className="site-nav__mobile-cta"><WhatsAppButton compact /></div></nav>
        <div className="site-header__actions"><a className="header-phone" href="tel:+56952254029"><Phone size={15} /><span>9 5225 4029</span></a><WhatsAppButton compact /><button className="menu-toggle" type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-section__media" style={{ transform: `translateY(${scrollY * 0.08}px)` }}><video autoPlay muted loop playsInline poster={SPACE_IMAGE} aria-label="Entrenamiento funcional en Plaza Fitness"><source src={VIDEO_URL} type="video/mp4" /></video></div><div className="hero-section__veil" /><div className="hero-section__grid" aria-hidden="true" /><div className="hero-section__orb hero-section__orb--one" style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0)` }} />
          <div className="hero-content container"><div className="hero-content__topline"><span>VIÑA DEL MAR · CHILE</span><span className="hero-content__topline-rule" /><span>CALLE QUILLOTA 656</span></div><div className="hero-content__main reveal-on-scroll"><div className="hero-content__eyebrow"><ShieldCheck size={14} /> Entrenamiento funcional guiado.</div><h1>Fuerza que se<span>adapta a ti.</span></h1><p className="hero-content__lede">Clases dinámicas con profesores en cada estación para cuidar tu técnica, adaptar el desafío y convertir el movimiento en salud real.</p><div className="hero-content__actions"><WhatsAppButton /><a href="#horarios" className="text-link text-link--light">Ver horarios <ArrowRight size={16} /></a></div></div><div className="hero-content__bottomline"><div className="hero-stat glass-card"><span className="hero-stat__value">01</span><span className="hero-stat__label">GUÍA REAL<br /><small>NIVEL ADAPTADO</small></span></div><div className="hero-scroll"><span>SCROLL TO TRAIN</span><ChevronDown size={16} /></div><div className="hero-stamp"><BrandMark className="brand-mark--stamp" /></div></div></div>
          <aside className={`interval-sim interval-sim--${timerSegment.tone}`} aria-label="Simulador de intervalo de entrenamiento"><div className="interval-sim__top"><span>SESSION / 01</span><button type="button" onClick={() => setTimerSound((value) => !value)} aria-label={timerSound ? "Silenciar pitido" : "Activar pitido suave"}>{timerSound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button></div><div className="interval-sim__dial" style={{ "--progress": `${timerProgress}%` } as React.CSSProperties}><strong>{String(timerRemaining).padStart(2, "0")}</strong><span>SEG</span></div><div className="interval-sim__copy"><b>{timerSegment.label}</b><span>{timerSegment.caption}</span></div><div className="interval-sim__controls"><button type="button" onClick={() => { if (!timerRunning && timerSound) cue(); setTimerRunning((value) => !value); }}><span>{timerRunning ? <Pause size={15} /> : <Play size={15} />}</span>{timerRunning ? "Pausar" : "Iniciar"}</button><button type="button" onClick={resetTimer} aria-label="Reiniciar simulador"><RotateCcw size={15} /></button></div><small>Audio opcional · se activa solo al tocar</small></aside>
        </section>

        <section id="metodo" className="manifesto-section section-dark"><div className="manifesto-section__blueprint" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div><div className="container manifesto-layout"><div className="manifesto-layout__aside"><SectionTag light>Centro de entrenamiento</SectionTag><div className="vertical-note">TÉCNICA / SALUD / PROGRESIÓN</div></div><div className="manifesto-layout__content"><h2 className="reveal-on-scroll">Tu progreso<span>tiene método.</span></h2><p className="manifesto-lede reveal-on-scroll">Plaza Fitness entrega entrenamiento funcional dinámico con una mirada completa: cada clase ayuda a mejorar o mantener tu condición física, capacidad cardiorrespiratoria, fuerza, movilidad, control articular y composición corporal para una vida más activa y sana.</p><div className="method-list">{method.map((item, index) => <div className="method-item reveal-on-scroll" style={{ "--delay": `${index * 55}ms` } as React.CSSProperties} key={item.id}><span className="method-item__number">{item.id}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={18} /></div>)}</div></div></div></section>

        <section id="horarios" className="schedule-section section-bone"><div className="section-meter" aria-hidden="true"><span>02 / 05</span><i /><span>CIRCUITO SEMANAL / HORARIOS</span></div><div className="container schedule-section__head"><div><SectionTag>Elige tu circuito</SectionTag><h2>Entrena a<br /><em>tu ritmo.</em></h2></div><p>Selecciona el bloque que mejor conversa con tu semana. Cada circuito revela sus estaciones horarias sin tablas ni pasos innecesarios.</p></div><div className="container schedule-circuit"><div className="schedule-circuit__switch" role="tablist" aria-label="Circuitos semanales">{scheduleGroups.map((group) => <button key={group.id} type="button" role="tab" aria-selected={activeSchedule === group.id} className={activeSchedule === group.id ? "is-active" : ""} onClick={() => setActiveSchedule(group.id)}><span>{group.badge}</span><strong>{group.nav}</strong><small>{group.id === "sat" ? "Fin de semana" : "Circuito semanal"}</small><ChevronRight size={17} /></button>)}</div><div className="schedule-circuit__stage" role="tabpanel"><div className="schedule-circuit__stage-head"><span>RUTA / {currentSchedule.badge}</span><h3>{currentSchedule.title}</h3><p>{currentSchedule.days} · {currentSchedule.brief}</p></div><div className="schedule-stations">{currentSchedule.slots.map((slot, index) => <a key={slot} className="schedule-station" href={buildWhatsappLink(`Hola Plaza Fitness, quiero consultar por el horario ${slot} de ${currentSchedule.days}.`)} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span><i /><strong>{slot}</strong><small>Consultar</small></a>)}</div><div className="schedule-circuit__action"><span>¿No sabes qué horario elegir?</span><a href={buildWhatsappLink("Hola Plaza Fitness, necesito ayuda para elegir un horario de entrenamiento funcional.")} target="_blank" rel="noreferrer">Hablar con Plaza Fitness <ArrowUpRight size={16} /></a></div></div></div><div className="container schedule-section__source"><details><summary><span>Ver horarios oficiales publicados</span><ChevronDown size={17} /></summary><img src={SCHEDULE_SOURCE} alt="Gráfica de horarios oficiales de Plaza Fitness" loading="lazy" /></details></div></section>

        <section id="planes" className="plans-command-section section-dark"><div className="plans-command-section__trail" aria-hidden="true"><span>PLAN</span><i /><span>CHOOSE</span><i /><span>START</span></div><div className="container plans-command-section__head"><div><SectionTag light>Elige tu plan</SectionTag><h2>Tu siguiente<br /><em>round.</em></h2></div><p>Explora cada formato en perspectiva. Cuando estés listo, abre la inscripción del plan que mejor calza con tu ritmo.</p></div><div className="container audience-switch" role="group" aria-label="Elegir tipo de plan"><button type="button" className={audience === "general" ? "is-active" : ""} onClick={() => { setAudience("general"); setRevealedPlan(null); }}><span>01</span>Planes generales</button><button type="button" className={audience === "student" ? "is-active" : ""} onClick={() => { setAudience("student"); setRevealedPlan(null); }}><span>02</span>Planes estudiantes</button></div><div className="plans-perspective-track" role="region" aria-label="Planes de entrenamiento con detalle interactivo"><div className="plans-perspective-track__inner">{audiencePlans.map((plan) => <PlanPerspectiveCard key={plan.id} plan={plan} revealed={revealedPlan === plan.id} onReveal={() => setRevealedPlan((current) => current === plan.id ? null : plan.id)} onStart={() => openEnrollment(plan)} />)}</div></div><div className="container plans-command-section__foot"><span><strong>Perspective Reveal</strong> · toca cada tarjeta para girar y conocer su ritmo.</span><a href={buildWhatsappLink("Hola Plaza Fitness, quiero que me orienten para elegir un plan.")} target="_blank" rel="noreferrer" className="text-link text-link--light">Necesito orientación <ArrowRight size={16} /></a></div></section>

        <section id="reglas" className="rules-section section-bone"><div className="section-meter" aria-hidden="true"><span>04 / 05</span><i /><span>REGLAS / RITMO / CUIDADO</span></div><div className="container rules-section__head"><div><SectionTag>Reglas de la pista</SectionTag><h2>Todo claro.<br /><em>Todo visible.</em></h2></div><p>Información simple para que organices tus clases, cuides los cupos y mantengas tu entrenamiento en movimiento.</p></div><div className="container policy-panel">{policies.map((policy, index) => { const Icon = policy.icon; return <article className="policy-panel__card reveal-on-scroll" style={{ "--delay": `${index * 45}ms` } as React.CSSProperties} key={policy.metric}><span className="policy-panel__icon"><Icon size={21} /></span><div><b>{policy.metric}</b><h3>{policy.title}</h3><p>{policy.text}</p></div></article>; })}</div><div className="container rules-source"><details><summary><span>Ver pieza informativa original</span><ChevronDown size={17} /></summary><img src={POLICIES_SOURCE} alt="Gráfica de reglas e información importante de Plaza Fitness" loading="lazy" /></details></div></section>

        <section id="contacto" className="contact-section section-dark"><div className="contact-section__mark" aria-hidden="true"><BrandMark className="brand-mark--contact" decorative /></div><div className="container contact-layout"><div className="contact-layout__main"><SectionTag light>Da el siguiente paso</SectionTag><h2>Nos vemos<br /><em>en la pista.</em></h2><p>Escríbenos para confirmar tu plan, activar tu acceso y encontrar el horario que calza contigo.</p><WhatsAppButton /></div><div className="contact-layout__details"><div className="contact-detail"><MapPin size={20} /><div><span>Encuéntranos</span><strong>Calle Quillota 656<br />Viña del Mar, Valparaíso</strong></div></div><div className="contact-detail"><Clock3 size={20} /><div><span>Horarios</span><strong>Consulta el circuito que<br />mejor calza contigo</strong></div></div><div className="contact-detail"><Phone size={20} /><div><span>WhatsApp</span><strong>+56 9 5225 4029</strong></div></div></div></div><div className="contact-section__marquee" aria-hidden="true"><span>PLAZA FITNESS · CALLE QUILLOTA 656 · VIÑA DEL MAR · </span><span>PLAZA FITNESS · CALLE QUILLOTA 656 · VIÑA DEL MAR · </span></div></section>
      </main>

      <footer className="site-footer section-dark"><div className="container site-footer__inner"><a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio"><BrandMark className="brand-mark--footer" /></a><span className="site-footer__copy">© 2026 Plaza Fitness · Calle Quillota 656 · Viña del Mar</span><div className="site-footer__links"><a href={buildWhatsappLink("Hola Plaza Fitness, quiero información.")} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href="#inicio"><Instagram size={15} /> Instagram</a></div></div></footer>
      {selectedPlan && <EnrollmentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} copyValue={copyValue} copied={copied} />}
    </div>
  );
}
