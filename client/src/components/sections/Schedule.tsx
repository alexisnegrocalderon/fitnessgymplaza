import { Clock3 } from "lucide-react";
import { SectionTag } from "@/components/common";
import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { scheduleGroups } from "@/lib/gym-content";

export default function Schedule() {
  return (
    <section id="horarios" className="schedule-section section-bone">
      <div className="section-meter" aria-hidden="true">
        <span>04 / 07</span>
        <i />
        <span>Ritmo semanal / Horarios</span>
      </div>
      <div className="container schedule-section__head">
        <div>
          <Reveal>
            <SectionTag>Horarios Plaza Fitness</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>
              Abre tu
              <br />
              <em>jornada.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.14}>
          <p>
            Tres ritmos, una semana. Toca cada barra para desplegar las clases
            disponibles; la toma de cupos se incorporará próximamente para
            alumnos activos.
          </p>
        </Reveal>
      </div>

      <Reveal className="container schedule-accordion" amount={0.15}>
        <div className="schedule-accordion__top">
          <span>Horarios vigentes</span>
          <span>Despliega una jornada</span>
        </div>
        <Accordion
          type="single"
          collapsible
          defaultValue="lwmf"
          className="schedule-accordion__list"
        >
          {scheduleGroups.map((group, index) => (
            <AccordionItem
              className="schedule-accordion__item"
              key={group.id}
              value={group.id}
            >
              <AccordionTrigger className="schedule-accordion__trigger">
                <span className="schedule-accordion__serial">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="schedule-accordion__day">
                  <strong>{group.nav}</strong>
                  <small>{group.days}</small>
                </span>
                <span className="schedule-accordion__label">
                  {group.id === "sat" ? "Fin de semana" : "Semana activa"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="schedule-accordion__content">
                <div className="schedule-accordion__body">
                  <p>{group.brief}</p>
                  <div className="schedule-accordion__slots">
                    {group.slots.map((slot, slotIndex) => (
                      <div key={slot}>
                        <span>{String(slotIndex + 1).padStart(2, "0")}</span>
                        <strong>{slot}</strong>
                        <small>Entrenamiento funcional</small>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="schedule-accordion__notice">
          <Clock3 size={17} />
          <p>
            Horarios informativos. Próximamente podrás ingresar como alumno
            activo, tomar cupos y ver tu agenda desde los terminales de Plaza
            Fitness.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
