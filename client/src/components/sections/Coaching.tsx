import { SectionTag } from "@/components/common";
import { Reveal } from "@/components/Reveal";
import { COACHING_IMAGE } from "@/lib/gym-content";

export default function Coaching() {
  return (
    <section className="coaching-section section-dark">
      <div className="section-meter section-meter--light" aria-hidden="true"><span>04 / 05</span><i /><span>Person / Load / Range</span></div>
      <div className="container coaching-layout">
        <Reveal kind="scale" className="coaching-layout__visual">
          <div className="image-frame image-frame--portrait">
            <img src={COACHING_IMAGE} alt="Coach guiando un entrenamiento personalizado" loading="lazy" />
          </div>
          <div className="coaching-layout__index">02<span>/</span>03</div>
        </Reveal>
        <div className="coaching-layout__copy">
          <Reveal>
            <SectionTag light>Entrenamiento que escucha</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.08}>
            <h2>Tu cuerpo<br /><em>marca el ritmo.</em></h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p>
              No hay dos personas iguales. Por eso combinamos criterio técnico, atención cercana y un estímulo que se adapta a ti. Entrenar personalizado no es hacer más; es hacer lo que toca.
            </p>
          </Reveal>
          <Reveal kind="fade" delay={0.26}>
            <div className="coaching-quote glass-card">
              <span className="coaching-quote__mark">"</span>
              <p>La precisión también puede sentirse poderosa.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
