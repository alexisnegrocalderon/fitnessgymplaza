import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { BrandMark, WhatsAppButton } from "@/components/common";
import { VIDEO_URL } from "@/lib/gym-content";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const mediaY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const orbOneY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section id="inicio" className="hero-section" ref={sectionRef}>
      <motion.div className="hero-section__media" style={{ y: mediaY }}>
        <video autoPlay muted loop playsInline aria-label="Animación del emblema de Plaza Fitness">
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </motion.div>
      <div className="hero-section__veil" />
      <div className="hero-section__grid" aria-hidden="true" />
      <motion.div className="hero-section__orb hero-section__orb--one" style={{ y: orbOneY }} />
      <motion.div className="hero-section__orb hero-section__orb--two" style={{ y: orbTwoY }} />

      <div className="hero-content container">
        <motion.div
          className="hero-content__topline"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <span>Viña del Mar · Chile</span>
          <span className="hero-content__topline-rule" />
          <span>Est. 2018 / Reopened 2026</span>
        </motion.div>
        <div className="hero-content__main">
          <motion.div
            className="hero-content__eyebrow"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <Sparkles size={14} /> Nuevo espacio. Misma energía.
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            Entrena como si
            <em>importara.</em>
          </motion.h1>
          <motion.p
            className="hero-content__lede"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            Entrenamiento funcional y personalizado para moverte con más potencia, precisión y constancia.
          </motion.p>
          <motion.div
            className="hero-content__actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: [0.23, 1, 0.32, 1] }}
          >
            <WhatsAppButton />
            <a href="#metodo" className="text-link text-link--light">
              Conoce el método <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
        <div className="hero-content__bottomline">
          <div className="hero-stat glass-card">
            <span className="hero-stat__value">5.0</span>
            <span className="hero-stat__label">Google rating<br /><small>Viña del Mar</small></span>
          </div>
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
