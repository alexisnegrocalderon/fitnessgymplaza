import { useMemo, useState } from "react";
import { ChevronRight, ClipboardCheck, UserRound } from "lucide-react";
import { BrandMark, SectionTag, WhatsAppButton } from "@/components/common";
import EnrollmentModal from "@/components/EnrollmentModal";
import PlansCarousel from "@/components/PlansCarousel";
import { Reveal } from "@/components/Reveal";
import { plans, type Audience, type Plan } from "@/lib/gym-content";

export default function Plans() {
  const [audience, setAudience] = useState<Audience>("general");
  const [selected, setSelected] = useState<{
    plan: Plan;
    origin: HTMLElement;
  } | null>(null);

  const audiencePlans = useMemo(
    () => plans.filter(plan => plan.audience === audience),
    [audience]
  );

  return (
    <section id="planes" className="plans-section section-bone">
      <BrandMark
        className="plans-section__brand-anchor"
        decorative
      />
      <div className="plans-section__top container">
        <div>
          <Reveal>
            <SectionTag>Elige tu plan</SectionTag>
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

      <Reveal delay={0.1} className="container athlete-selector-wrap">
        <div
          className="athlete-selector"
          role="group"
          aria-label="Seleccionar tipo de plan"
        >
          <button
            type="button"
            className={`athlete-selector__card ${audience === "general" ? "is-active" : ""}`}
            onClick={() => setAudience("general")}
          >
            <UserRound size={22} />
            <div>
              <strong>Plan general</strong>
              <small>Para quienes entrenan a su propio ritmo</small>
            </div>
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className={`athlete-selector__card ${audience === "student" ? "is-active" : ""}`}
            onClick={() => setAudience("student")}
          >
            <ClipboardCheck size={22} />
            <div>
              <strong>Plan estudiante</strong>
              <small>Con tarifa y certificado vigente</small>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      </Reveal>

      <PlansCarousel
        plans={audiencePlans}
        onSelectPlan={(plan, origin) => setSelected({ plan, origin })}
      />

      <div className="plans-section__foot container">
        <span>Valores y horarios disponibles por WhatsApp</span>
        <WhatsAppButton compact />
      </div>

      <EnrollmentModal
        plan={selected?.plan ?? null}
        origin={selected?.origin ?? null}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
