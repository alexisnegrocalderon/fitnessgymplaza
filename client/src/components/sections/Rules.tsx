import {
  BellRing,
  CalendarDays,
  Clock3,
  Gift,
  Stethoscope,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import { SectionTag } from "@/components/common";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { policies } from "@/lib/gym-content";

const ICONS: LucideIcon[] = [
  CalendarDays,
  Clock3,
  TimerReset,
  BellRing,
  Gift,
  Stethoscope,
];

export default function Rules() {
  return (
    <section id="reglas" className="rules-section section-bone">
      <div className="section-meter" aria-hidden="true">
        <span>05 / 07</span>
        <i />
        <span>Reglas / Ritmo / Cuidado</span>
      </div>
      <div className="container rules-section__head">
        <div>
          <Reveal>
            <SectionTag>Reglas de la pista</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>
              Todo claro.
              <br />
              <em>Todo visible.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.14}>
          <p>
            Información simple para que organices tus clases, cuides los cupos y
            mantengas tu entrenamiento en movimiento.
          </p>
        </Reveal>
      </div>
      <RevealGroup className="container policy-panel" stagger={0.06}>
        {policies.map((policy, index) => {
          const Icon = ICONS[index] ?? CalendarDays;
          return (
            <RevealItem className="policy-panel__card" key={policy.metric}>
              <span className="policy-panel__icon">
                <Icon size={21} />
              </span>
              <div>
                <b>{policy.metric}</b>
                <h3>{policy.title}</h3>
                <p>{policy.text}</p>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
