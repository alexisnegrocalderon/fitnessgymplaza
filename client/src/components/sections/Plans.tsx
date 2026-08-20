import { SectionTag, WhatsAppButton } from "@/components/common";
import PlansCarousel from "@/components/PlansCarousel";
import { Reveal } from "@/components/Reveal";

export default function Plans() {
  return (
    <section id="planes" className="plans-section section-bone">
      <div className="plans-section__top container">
        <div>
          <Reveal>
            <SectionTag>Encuentra tu formato</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>
              Tu próximo
              <br />
              <em>circuito empieza aquí.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal kind="fade" delay={0.12} className="plans-section__hint">
          <span>Arrastra para explorar</span>
        </Reveal>
      </div>

      <PlansCarousel />

      <div className="plans-section__foot container">
        <span>Valores y horarios disponibles por WhatsApp</span>
        <WhatsAppButton compact />
      </div>
    </section>
  );
}
