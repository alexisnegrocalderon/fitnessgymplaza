import { ArrowUpRight } from "lucide-react";
import { SectionTag } from "@/components/common";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { method } from "@/lib/gym-content";

export default function Method() {
  return (
    <section id="metodo" className="manifesto-section section-dark">
      <div className="manifesto-section__blueprint" aria-hidden="true">
        <span>01</span>
        <span>02</span>
        <span>03</span>
        <span>04</span>
      </div>
      <div className="container manifesto-layout">
        <div className="manifesto-layout__aside">
          <SectionTag light>Centro de entrenamiento</SectionTag>
          <div className="vertical-note">Técnica / Salud / Progresión</div>
        </div>
        <div className="manifesto-layout__content">
          <Reveal kind="mask">
            <h2>
              Tu progreso
              <em>tiene método.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="manifesto-lede">
              Plaza Fitness entrega entrenamiento funcional dinámico con una
              mirada completa: cada clase ayuda a mejorar o mantener tu
              condición física, capacidad cardiorrespiratoria, fuerza,
              movilidad, control articular y composición corporal para una vida
              más activa y sana.
            </p>
          </Reveal>
          <RevealGroup className="method-list">
            {method.map(item => (
              <RevealItem className="method-item" key={item.id}>
                <span className="method-item__number">{item.id}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <ArrowUpRight size={18} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
