import { ArrowRight, Dumbbell } from "lucide-react";
import { SectionTag } from "@/components/common";
import { Reveal } from "@/components/Reveal";
import { SPACE_IMAGE } from "@/lib/gym-content";

export default function Space() {
  return (
    <section id="espacio" className="space-section section-bone">
      <div className="space-section__wash" aria-hidden="true" />
      <div className="section-meter" aria-hidden="true"><span>03 / 05</span><i /><span>Space / 2026</span></div>
      <div className="container space-layout">
        <div className="space-layout__copy">
          <Reveal>
            <SectionTag>La reinauguración</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.05}>
            <h2>Más espacio.<br /><em>Más posibilidades.</em></h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p>
              Acabamos de reabrir las puertas después de una remodelación completa. Nuevo equipamiento, mejor flujo y un espacio que está listo para acompañar tu próxima etapa.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="space-details">
              <div><span>01</span><strong>Nuevo equipamiento</strong></div>
              <div><span>02</span><strong>Más espacio de entrenamiento</strong></div>
              <div><span>03</span><strong>Atención personalizada</strong></div>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <a href="#contacto" className="text-link">Ven a conocerlo <ArrowRight size={16} /></a>
          </Reveal>
        </div>
        <Reveal kind="scale" delay={0.1} className="space-layout__visual">
          <div className="image-frame image-frame--large">
            <img src={SPACE_IMAGE} alt="Interior remodelado de Plaza Fitness con equipamiento funcional" loading="lazy" />
            <div className="image-frame__caption"><span>08 Nte. 855</span><span>Viña del Mar</span></div>
          </div>
          <div className="image-note glass-card glass-card--bone">
            <Dumbbell size={22} />
            <span>Diseñado para<br /><strong>avanzar.</strong></span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
