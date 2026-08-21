import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, ClipboardCheck, UserRound } from "lucide-react";
import { BrandMark, SectionTag, WhatsAppButton } from "@/components/common";
import { Reveal } from "@/components/Reveal";
import { calm, spring } from "@/lib/motion";
import {
  GRIP_IMAGE,
  plans,
  type Audience,
  type Plan,
  type PlanTier,
} from "@/lib/gym-content";

const BASE_CHECKS = [
  "Entrenamiento funcional guiado",
  "Profesores presentes por estación",
  "Horarios para elegir según tu rutina",
];

const AUDIENCE_ITEMS: { id: Audience; label: string; icon: ReactNode }[] = [
  { id: "general", label: "General", icon: <UserRound size={16} /> },
  { id: "student", label: "Estudiante", icon: <ClipboardCheck size={16} /> },
];

const TIER_BADGE: Record<PlanTier, string> = {
  single: "01",
  eight: "08",
  twelve: "12",
  pack3: "P3",
  pack6: "P6",
};

const TIER_ITEMS: { id: PlanTier; label: string }[] = [
  { id: "single", label: "Pase diario" },
  { id: "eight", label: "8 clases" },
  { id: "twelve", label: "12 clases" },
  { id: "pack3", label: "Pack 3 meses" },
  { id: "pack6", label: "Pack 6 meses" },
];

/**
 * Control segmentado tipo pill: el fondo activo es un único elemento
 * compartido (layoutId) que se desliza y cambia de tamaño entre pestañas
 * en vez de aparecer/desaparecer — la pestaña activa también puede crecer
 * para revelar contenido extra (el precio), y framer-motion resuelve la
 * transición de layout completa con un resorte.
 */
function SegmentedPill<T extends string>({
  layoutGroup,
  items,
  value,
  onChange,
  extra,
  accent = false,
}: {
  layoutGroup: string;
  items: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  extra?: (id: T) => ReactNode;
  /** Fondo activo en rojo (paleta de marca) en vez del graphite por defecto. */
  accent?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`segmented ${accent ? "segmented--accent" : ""}`}
      role="tablist"
    >
      {items.map(item => {
        const active = item.id === value;
        return (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            layout
            transition={reduced ? calm : spring.ui}
            className={`segmented__tab ${active ? "is-active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            {active && (
              <motion.span
                layoutId={`${layoutGroup}-pill`}
                className="segmented__pill"
                transition={reduced ? calm : spring.ui}
              />
            )}
            <span className="segmented__content">
              {item.icon && (
                <span className="segmented__icon">{item.icon}</span>
              )}
              <span className="segmented__label">{item.label}</span>
              {active && extra && (
                <span className="segmented__extra">{extra(item.id)}</span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function PlanDetail({ plan }: { plan: Plan }) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={plan.id}
        className={`plan-detail ${plan.featured ? "plan-detail--featured" : ""}`}
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97, filter: "blur(6px)" }
        }
        animate={
          reduced
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        transition={reduced ? calm : spring.ui}
      >
        <div className="plan-detail__media">
          <img
            src={GRIP_IMAGE}
            alt="Piso de entrenamiento de Plaza Fitness con el mezzanine y la instalación de luces al fondo"
            loading="lazy"
          />
          <div className="plan-detail__media-copy">
            <span>{TIER_BADGE[plan.tier]}</span>
            <strong>El plan es moverte.</strong>
          </div>
          {plan.featured && (
            <span className="plan-detail__badge">Más elegido</span>
          )}
        </div>
        <div className="plan-detail__body">
          <span className="plan-detail__kicker">{plan.tagline}</span>
          <h3>{plan.label}</h3>
          <strong className="plan-detail__price">{plan.price}</strong>
          <p>{plan.note}</p>
          <span className="plan-detail__cadence">{plan.cadence}</span>
          <ul>
            {BASE_CHECKS.map(feature => (
              <li key={feature}>
                <Check size={15} /> {feature}
              </li>
            ))}
            {plan.studentRequirement && (
              <li>
                <Check size={15} /> Presenta certificado de alumno regular
              </li>
            )}
          </ul>
          <a
            href={`/planes?audience=${plan.audience}&tier=${plan.tier}`}
            className="plan-detail__cta"
          >
            Continuar inscripción <ArrowUpRight size={16} />
          </a>
        </div>
      </motion.article>
    </AnimatePresence>
  );
}

export default function Plans() {
  const [audience, setAudience] = useState<Audience>("general");
  const [tier, setTier] = useState<PlanTier>("single");

  const audiencePlans = useMemo(
    () => plans.filter(plan => plan.audience === audience),
    [audience]
  );
  const activePlan = useMemo(
    () => audiencePlans.find(plan => plan.tier === tier) ?? audiencePlans[0],
    [audiencePlans, tier]
  );
  const priceByTier = useMemo(
    () => new Map(audiencePlans.map(plan => [plan.tier, plan.price])),
    [audiencePlans]
  );

  return (
    <section id="planes" className="plans-section section-bone">
      <BrandMark className="plans-section__brand-anchor" decorative />
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
          <span>Toca para comparar</span>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="container plans-selector">
        <SegmentedPill
          layoutGroup="audience"
          items={AUDIENCE_ITEMS}
          value={audience}
          onChange={setAudience}
          accent
        />
        <SegmentedPill
          layoutGroup="tier"
          items={TIER_ITEMS}
          value={tier}
          onChange={setTier}
          extra={id => priceByTier.get(id)}
        />
      </Reveal>

      <div className="container">
        <PlanDetail plan={activePlan} />
      </div>

      <div className="plans-section__foot container">
        <span>Valores y horarios disponibles por WhatsApp</span>
        <WhatsAppButton compact />
      </div>
    </section>
  );
}
