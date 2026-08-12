import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { SectionTag, WhatsAppButton } from "@/components/common";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { GRIP_IMAGE, WHATSAPP_URL, plans } from "@/lib/gym-content";

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className={`plan-card-h ${plan.featured ? "plan-card-h--featured" : ""}`}>
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
      {plan.featured && <span className="plan-card__badge">Recomendado</span>}
    </article>
  );
}

function PlansHorizontal() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -shift]);

  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      if (!track) return;
      const trackWidth = track.scrollWidth;
      const viewportWidth = track.parentElement?.clientWidth ?? window.innerWidth;
      setShift(Math.max(trackWidth - viewportWidth, 0));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="plans-pin-wrap" ref={wrapRef} style={{ height: `calc(100vh + ${shift}px)` }}>
      <div className="plans-pin-sticky">
        <motion.div className="plans-track-h" ref={trackRef} style={{ x }}>
          {plans.map((plan) => <PlanCard plan={plan} key={plan.number} />)}
          <div className="plans-track-h__accent">
            <img src={GRIP_IMAGE} alt="Manos sujetando una cuerda de entrenamiento" loading="lazy" />
            <div className="plans-grid__accent-copy"><span>04</span><strong>El plan es moverte.</strong></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PlansStacked() {
  return (
    <RevealGroup className="plans-stack container" stagger={0.12}>
      {plans.map((plan) => (
        <RevealItem key={plan.number} kind="rise" className="plan-card-h-wrap">
          <PlanCard plan={plan} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export default function Plans() {
  const isDesktop = useIsDesktop();

  return (
    <section id="planes" className="plans-section section-bone">
      <div className="plans-section__top container">
        <div>
          <Reveal>
            <SectionTag>Encuentra tu formato</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>Tu próximo<br /><em>circuito empieza aquí.</em></h2>
          </Reveal>
        </div>
      </div>

      {isDesktop ? <PlansHorizontal /> : <PlansStacked />}

      <div className="plans-section__foot container">
        <span>Valores y horarios disponibles por WhatsApp</span>
        <WhatsAppButton compact />
      </div>
    </section>
  );
}
