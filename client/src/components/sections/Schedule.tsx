import { Clock3 } from "lucide-react";
import { SectionTag } from "@/components/common";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { scheduleGroups } from "@/lib/gym-content";

export default function Schedule() {
  return (
    <section id="horarios" className="schedule-section section-bone">
      <div className="section-meter" aria-hidden="true">
        <span>05 / 08</span>
        <i />
        <span>Tablero de sesiones / Horarios</span>
      </div>
      <div className="container schedule-section__head">
        <div>
          <Reveal>
            <SectionTag>Horarios Plaza Fitness</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>
              Elige cuándo
              <br />
              <em>moverte.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.14}>
          <p>
            Un tablero informativo para ubicar las sesiones de la semana. La
            agenda digital y la toma de cupos se incorporarán próximamente para
            alumnos activos.
          </p>
        </Reveal>
      </div>

      <RevealGroup
        className="container session-board"
        stagger={0.08}
        amount={0.15}
      >
        <div className="session-board__top">
          <span>Sesiones semanales</span>
          <span>Información actual</span>
        </div>
        <div className="session-board__columns">
          {scheduleGroups.map(group => (
            <RevealItem className="session-board__column" key={group.id}>
              <header>
                <span>{group.badge}</span>
                <div>
                  <strong>{group.nav}</strong>
                  <small>{group.days}</small>
                </div>
              </header>
              <p>{group.brief}</p>
              <div className="session-board__slots">
                {group.slots.map(slot => (
                  <div key={slot}>
                    <i />
                    <strong>{slot}</strong>
                  </div>
                ))}
              </div>
              <footer>
                <span>Horario informativo</span>
              </footer>
            </RevealItem>
          ))}
        </div>
        <div className="session-board__notice">
          <Clock3 size={17} />
          <p>
            Próximamente podrás ingresar como alumno activo, tomar cupos y ver
            tu agenda desde los terminales de Plaza Fitness.
          </p>
        </div>
      </RevealGroup>
    </section>
  );
}
