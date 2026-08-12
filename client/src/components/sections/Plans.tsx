import { ArrowUpRight, Check, Plus } from "lucide-react";
import { SectionTag, WhatsAppButton } from "@/components/common";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { GRIP_IMAGE, WHATSAPP_URL, plans } from "@/lib/gym-content";

export default function Plans() {
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

      <div className="container plans-grid-wrap">
        <RevealGroup className="plans-grid" stagger={0.12}>
          {plans.map((plan) => (
            <RevealItem
              key={plan.number}
              kind="rise"
              className={`plan-card ${plan.featured ? "plan-card--featured" : ""} plan-card--${plan.number}`}
            >
              <article className="plan-card__inner">
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
            </RevealItem>
          ))}

          <RevealItem kind="scale" className="plans-grid__accent">
            <img src={GRIP_IMAGE} alt="Manos sujetando una cuerda de entrenamiento" loading="lazy" />
            <div className="plans-grid__accent-copy"><span>04</span><strong>El plan es moverte.</strong></div>
          </RevealItem>
        </RevealGroup>
      </div>

      <div className="plans-section__foot container">
        <span>Valores y horarios disponibles por WhatsApp</span>
        <WhatsAppButton compact />
      </div>
    </section>
  );
}
