/*
 * Style reminder: Laboratorio de Movimiento — a premium editorial-athletic landing
 * for Plaza Fitness. Use asymmetry, hard contrast, red markers, smoky glass cards,
 * parallax and horizontal plan choreography. No invented testimonials or pricing.
 */
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

const VIDEO_URL = "/manus-storage/plaza-fitness-hero_d9cbc2e5.mp4";
const MARK_URL = "/manus-storage/plaza-fitness-original-logo_078d76fa.png";
const SPACE_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=88";
const COACHING_IMAGE = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=88";
const GRIP_IMAGE = "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1400&q=88";
const WHATSAPP_URL =
  "https://wa.me/56952254029?text=Hola%20Plaza%20Fitness%2C%20quiero%20conocer%20los%20planes%20y%20horarios.";

const plans = [
  {
    number: "01",
    title: "Personal 1:1",
    kicker: "Foco total",
    description:
      "Una sesión diseñada alrededor de tu objetivo, tu nivel y el tiempo que tienes para entrenar.",
    features: ["Guía directa", "Corrección técnica", "Progresión a medida"],
  },
  {
    number: "02",
    title: "Funcional",
    kicker: "Ritmo de equipo",
    description:
      "Muévete, transpira y progresa en sesiones guiadas que combinan fuerza, potencia y control.",
    features: ["Cupos limitados", "Nuevo equipamiento", "Energía compartida"],
    featured: true,
  },
  {
    number: "03",
    title: "Plan Inicio",
    kicker: "Parte bien",
    description:
      "El primer paso para entender cómo entrenar mejor y convertir la constancia en una práctica.",
    features: ["Orientación inicial", "Objetivos claros", "Acompañamiento"],
  },
];

const method = [
  {
    id: "01",
    title: "Entender",
    text: "Conocemos tu punto de partida, tu historia y lo que de verdad quieres mover.",
  },
  {
    id: "02",
    title: "Activar",
    text: "Diseñamos una sesión que te exige con intención, no por inercia.",
  },
  {
    id: "03",
    title: "Progresar",
    text: "Medimos el proceso y ajustamos el estímulo para que sigas avanzando.",
  },
];

function BrandMark({ className = "", decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <img
      src={MARK_URL}
      alt={decorative ? "" : "Plaza Fitness"}
      aria-hidden={decorative ? true : undefined}
      className={`brand-mark ${className}`}
    />
  );
}

function SectionTag({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <div className={`section-tag ${light ? "section-tag--light" : ""}`}>
      <span className="section-tag__line" />
      <span>{children}</span>
    </div>
  );
}

function WhatsAppButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      className={`button button--cobalt ${compact ? "button--compact" : ""}`}
    >
      <MessageCircle size={compact ? 16 : 18} strokeWidth={2.2} />
      <span>Conversemos</span>
      <ArrowUpRight size={16} />
    </a>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 48);
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio">
          <BrandMark className="brand-mark--header" />
        </a>

        <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navegación principal">
          <a href="#metodo" onClick={closeMenu}>Método</a>
          <a href="#espacio" onClick={closeMenu}>Espacio</a>
          <a href="#planes" onClick={closeMenu}>Planes</a>
          <a href="#contacto" onClick={closeMenu}>Contacto</a>
          <div className="site-nav__mobile-cta"><WhatsAppButton compact /></div>
        </nav>

        <div className="site-header__actions">
          <a className="header-phone" href="tel:+56952254029">
            <Phone size={15} /> <span>9 5225 4029</span>
          </a>
          <WhatsAppButton compact />
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-section__media" style={{ transform: `translateY(${scrollY * 0.08}px) scale(1)` }}>
            <video autoPlay muted loop playsInline poster={SPACE_IMAGE} aria-label="Entrenamiento funcional en Plaza Fitness">
              <source src={VIDEO_URL} type="video/mp4" />
            </video>
          </div>
          <div className="hero-section__veil" />
          <div className="hero-section__grid" aria-hidden="true" />
          <div className="hero-section__orb hero-section__orb--one" style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0)` }} />
          <div className="hero-section__orb hero-section__orb--two" style={{ transform: `translate3d(0, ${scrollY * 0.2}px, 0)` }} />

          <div className="hero-content container">
            <div className="hero-content__topline">
              <span>VIÑA DEL MAR · CHILE</span>
              <span className="hero-content__topline-rule" />
              <span>EST. 2018 / REOPENED 2026</span>
            </div>
            <div className="hero-content__main">
              <div className="hero-content__eyebrow"><Sparkles size={14} /> Nuevo espacio. Misma energía.</div>
              <h1>
                Entrena como si
                <span>importara.</span>
              </h1>
              <p className="hero-content__lede">
                Entrenamiento funcional y personalizado para moverte con más potencia, precisión y constancia.
              </p>
              <div className="hero-content__actions">
                <WhatsAppButton />
                <a href="#metodo" className="text-link text-link--light">
                  Conoce el método <ArrowRight size={16} />
                </a>
              </div>
            </div>
            <div className="hero-content__bottomline">
              <div className="hero-stat glass-card">
                <span className="hero-stat__value">5.0</span>
                <span className="hero-stat__label">Google rating<br /><small>Viña del Mar</small></span>
              </div>
              <div className="hero-scroll">
                <span>SCROLL TO TRAIN</span>
                <ChevronDown size={16} />
              </div>
              <div className="hero-stamp">
                <BrandMark className="brand-mark--stamp" />
              </div>
            </div>
          </div>
        </section>

        <section id="metodo" className="manifesto-section section-dark">
          <div className="manifesto-section__blueprint" aria-hidden="true">
            <span>01</span><span>02</span><span>03</span><span>04</span>
          </div>
          <div className="container manifesto-layout">
            <div className="manifesto-layout__aside">
              <SectionTag light>El método Plaza</SectionTag>
              <div className="vertical-note">FUERZA / CONTROL / PROGRESIÓN</div>
            </div>
            <div className="manifesto-layout__content">
              <h2>
                No vienes a
                <span>sobrevivir</span>
                una rutina.
              </h2>
              <p className="manifesto-lede">
                Vienes a construir una forma de moverte que te acompañe fuera del gym. En Plaza Fitness cada sesión tiene una razón, una medida y un siguiente paso.
              </p>
              <div className="method-list">
                {method.map((item) => (
                  <div className="method-item" key={item.id}>
                    <span className="method-item__number">{item.id}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                    <ArrowUpRight size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="espacio" className="space-section section-bone">
          <div className="space-section__wash" aria-hidden="true" />
          <div className="section-meter" aria-hidden="true"><span>03 / 05</span><i /><span>SPACE / 2026</span></div>
          <div className="container space-layout">
            <div className="space-layout__copy">
              <SectionTag>La reinauguración</SectionTag>
              <h2>Más espacio.<br /><em>Más posibilidades.</em></h2>
              <p>
                Acabamos de reabrir las puertas después de una remodelación completa. Nuevo equipamiento, mejor flujo y un espacio que está listo para acompañar tu próxima etapa.
              </p>
              <div className="space-details">
                <div><span>01</span><strong>Nuevo equipamiento</strong></div>
                <div><span>02</span><strong>Más espacio de entrenamiento</strong></div>
                <div><span>03</span><strong>Atención personalizada</strong></div>
              </div>
              <a href="#contacto" className="text-link">Ven a conocerlo <ArrowRight size={16} /></a>
            </div>
            <div className="space-layout__visual">
              <div className="image-frame image-frame--large">
                <img src={SPACE_IMAGE} alt="Interior remodelado de Plaza Fitness con equipamiento funcional" loading="lazy" />
                <div className="image-frame__caption"><span>08 NTE. 855</span><span>VIÑA DEL MAR</span></div>
              </div>
              <div className="image-note glass-card glass-card--bone">
                <Dumbbell size={22} />
                <span>Diseñado para<br /><strong>avanzar.</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section className="coaching-section section-dark">
          <div className="section-meter section-meter--light" aria-hidden="true"><span>04 / 05</span><i /><span>PERSON / LOAD / RANGE</span></div>
          <div className="container coaching-layout">
            <div className="coaching-layout__visual">
              <div className="image-frame image-frame--portrait">
                <img src={COACHING_IMAGE} alt="Coach guiando un entrenamiento personalizado" loading="lazy" />
              </div>
              <div className="coaching-layout__index">02<span>/</span>03</div>
            </div>
            <div className="coaching-layout__copy">
              <SectionTag light>Entrenamiento que escucha</SectionTag>
              <h2>Tu cuerpo<br /><span>marca el ritmo.</span></h2>
              <p>
                No hay dos personas iguales. Por eso combinamos criterio técnico, atención cercana y un estímulo que se adapta a ti. Entrenar personalizado no es hacer más; es hacer lo que toca.
              </p>
              <div className="coaching-quote glass-card">
                <span className="coaching-quote__mark">“</span>
                <p>La precisión también puede sentirse poderosa.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="planes" className="plans-section section-bone">
          <div className="plans-section__top container">
            <div>
              <SectionTag>Encuentra tu formato</SectionTag>
              <h2>Tu próximo<br /><em>circuito empieza aquí.</em></h2>
            </div>
            <div className="plans-section__instructions">
              <span>DESLIZA PARA EXPLORAR</span>
              <ArrowRight size={18} />
            </div>
          </div>
          <div className="plans-track" role="region" aria-label="Planes de entrenamiento, desliza horizontalmente">
            <div className="plans-track__inner">
              {plans.map((plan) => (
                <article className={`plan-card ${plan.featured ? "plan-card--featured" : ""}`} key={plan.number}>
                  <div className="plan-card__top"><span>{plan.number}</span><Plus size={17} /></div>
                  <div className="plan-card__body">
                    <span className="plan-card__kicker">{plan.kicker}</span>
                    <h3>{plan.title}</h3>
                    <p>{plan.description}</p>
                    <ul>
                      {plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}
                    </ul>
                  </div>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="plan-card__link">Consultar disponibilidad <ArrowUpRight size={16} /></a>
                </article>
              ))}
              <article className="plan-card plan-card--image">
                <img src={GRIP_IMAGE} alt="Manos sujetando una cuerda de entrenamiento" loading="lazy" />
                <div className="plan-card--image__veil" />
                <div className="plan-card--image__copy"><span>04</span><strong>El plan es moverte.</strong></div>
              </article>
            </div>
          </div>
          <div className="plans-section__foot container">
            <span>Valores y horarios disponibles por WhatsApp</span>
            <WhatsAppButton compact />
          </div>
        </section>

        <section id="contacto" className="contact-section section-bone">
          <div className="contact-section__mark" aria-hidden="true"><BrandMark className="brand-mark--contact" decorative /></div>
          <div className="section-meter" aria-hidden="true"><span>05 / 05</span><i /><span>CONTACT / VIÑA DEL MAR</span></div>
          <div className="container contact-layout">
            <div className="contact-layout__main">
              <SectionTag>Da el siguiente paso</SectionTag>
              <h2>Nos vemos<br /><em>en la pista.</em></h2>
              <p>Escríbenos y conversemos sobre tu objetivo, tu experiencia y el formato que mejor calza contigo.</p>
              <WhatsAppButton />
            </div>
            <div className="contact-layout__details">
              <div className="contact-detail"><MapPin size={20} /><div><span>Encuéntranos</span><strong>8 Nte. 855<br />Viña del Mar, Valparaíso</strong></div></div>
              <div className="contact-detail"><Clock3 size={20} /><div><span>Horarios</span><strong>Consulta disponibilidad<br />por WhatsApp</strong></div></div>
              <div className="contact-detail"><Phone size={20} /><div><span>WhatsApp</span><strong>+56 9 5225 4029</strong></div></div>
            </div>
          </div>
          <div className="contact-section__marquee" aria-hidden="true"><span>PLAZA FITNESS · FUNCTIONAL TRAINING · VIÑA DEL MAR · </span><span>PLAZA FITNESS · FUNCTIONAL TRAINING · VIÑA DEL MAR · </span></div>
        </section>
      </main>

      <footer className="site-footer section-dark">
        <div className="container site-footer__inner">
          <a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio"><BrandMark className="brand-mark--footer" /></a>
          <span className="site-footer__copy">© 2026 Plaza Fitness · Viña del Mar</span>
          <div className="site-footer__links"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href="#inicio"><Instagram size={15} /> Instagram</a></div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
