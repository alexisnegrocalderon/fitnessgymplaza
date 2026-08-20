import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowRight, ChevronDown, ShieldCheck } from "lucide-react";
import { BrandMark, WhatsAppButton } from "@/components/common";
import { ADDRESS_LINE, VIDEO_URL, MARK_URL } from "@/lib/gym-content";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { calm, spring } from "@/lib/motion";

const HEADLINE = "Fuerza que se";
const HEADLINE_ACCENT = "adapta a ti.";

/** Cada palabra entra por su cuenta: el titular se construye, no aparece. */
const word: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  visible: { opacity: 1, y: 0 },
};

function Words({ text, className }: { text: string; className?: string }) {
  const tokens = text.split(" ");
  return (
    <span className={className}>
      {tokens.map((token, i) => (
        // El espacio va como nodo de texto real: la máscara es presentación,
        // el titular tiene que seguir leyéndose y copiándose como una frase.
        <span key={`${token}-${i}`}>
          <span className="hero-word">
            <motion.span
              className="hero-word__inner"
              variants={word}
              transition={spring.reveal}
            >
              {token}
            </motion.span>
          </span>
          {i < tokens.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // El parallax es un lujo de escritorio: dos orbes de 36vw moviéndose sobre
  // un vídeo es lo más caro de toda la página en un teléfono de gama media.
  const parallax = isDesktop && !reduced;
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, parallax ? 72 : 0]);
  const orbOneY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, parallax ? -56 : 0]
  );
  const orbTwoY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, parallax ? 110 : 0]
  );

  const headline: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.055,
        delayChildren: reduced ? 0 : 0.12,
      },
    },
  };

  return (
    <section id="inicio" className="hero-section" ref={sectionRef}>
      <motion.div className="hero-section__media" style={{ y: mediaY }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={MARK_URL}
          aria-label="Animación del emblema de Plaza Fitness"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </motion.div>
      <div className="hero-section__veil" />
      <div className="hero-section__grid" aria-hidden="true" />
      {parallax && (
        <>
          <motion.div
            className="hero-section__orb hero-section__orb--one"
            style={{ y: orbOneY }}
          />
          <motion.div
            className="hero-section__orb hero-section__orb--two"
            style={{ y: orbTwoY }}
          />
        </>
      )}

      <div className="hero-content container">
        <motion.div
          className="hero-content__topline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : spring.ui}
        >
          <span>Viña del Mar · Chile</span>
          <span className="hero-content__topline-rule" />
          <span>{ADDRESS_LINE}</span>
        </motion.div>
        <div className="hero-content__main">
          <motion.div
            className="hero-content__eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? calm : { ...spring.ui, delay: 0.06 }}
          >
            <ShieldCheck size={14} /> Entrenamiento funcional guiado.
          </motion.div>
          <motion.h1 variants={headline} initial="hidden" animate="visible">
            <Words text={HEADLINE} />
            <em>
              <Words text={HEADLINE_ACCENT} />
            </em>
          </motion.h1>
          <motion.p
            className="hero-content__lede"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? calm : { ...spring.reveal, delay: 0.34 }}
          >
            Clases dinámicas con profesores en cada estación para cuidar tu
            técnica, adaptar el desafío y convertir el movimiento en salud real.
          </motion.p>
          <motion.div
            className="hero-content__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? calm : { ...spring.reveal, delay: 0.42 }}
          >
            <WhatsAppButton label="Comienza Hoy!" />
            <a href="#metodo" className="text-link text-link--light">
              Conoce el método <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
        <div className="hero-content__bottomline">
          {/* La tarjeta se materializa: el desenfoque y la escala llegan juntos,
              así el cristal se lee como una superficie real que aparece. */}
          <motion.div
            className="hero-stat glass-card"
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, filter: "blur(10px)" }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            transition={reduced ? calm : { ...spring.reveal, delay: 0.5 }}
          >
            <span className="hero-stat__value">01</span>
            <span className="hero-stat__label">
              Guía real
              <br />
              <small>Nivel adaptado</small>
            </span>
          </motion.div>
          <div className="hero-scroll">
            <span>Scroll para entrenar</span>
            <ChevronDown size={16} />
          </div>
          <div className="hero-stamp">
            <BrandMark className="brand-mark--stamp" />
          </div>
        </div>
      </div>
    </section>
  );
}
