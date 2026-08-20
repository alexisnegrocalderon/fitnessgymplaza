import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { buildWhatsappLink, transferData, type Plan } from "@/lib/gym-content";
import { calm, spring } from "@/lib/motion";

const STEPS = [
  {
    icon: UserRound,
    title: "Envía tus datos",
    text: "Nombre completo, email, RUT y comprobante de pago.",
  },
  {
    icon: CreditCard,
    title: "Transfiere tu plan",
    text: "Realiza la transferencia con los datos publicados y guarda tu comprobante.",
  },
  {
    icon: ClipboardCheck,
    title: "Recibe tu acceso",
    text: "El equipo te enviará la información necesaria para coordinar tus primeras sesiones.",
  },
];

export default function EnrollmentModal({
  plan,
  origin,
  onClose,
}: {
  plan: Plan | null;
  origin: HTMLElement | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  // El panel se abre desde donde nació el gesto: la tarjeta que se tocó,
  // no desde el centro de la pantalla. Doctrina del skill, §7.
  const originStyle =
    origin && typeof window !== "undefined"
      ? (() => {
          const rect = origin.getBoundingClientRect();
          const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
          const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
          return { transformOrigin: `${x}% ${y}%` };
        })()
      : undefined;

  return (
    <Dialog.Root open={Boolean(plan)} onOpenChange={open => !open && onClose()}>
      <AnimatePresence>
        {plan && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="enrollment-modal__scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={calm}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="enrollment-modal"
                style={originStyle}
                initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                transition={spring.sheet}
              >
                <Dialog.Close
                  className="enrollment-modal__close"
                  aria-label="Cerrar inscripción"
                >
                  <X size={20} />
                </Dialog.Close>
                <div className="enrollment-modal__glow" aria-hidden="true" />
                <div className="enrollment-modal__header">
                  <span className="section-tag section-tag--light">
                    <span className="section-tag__line" />
                    <span>Inscripción Plaza Fitness</span>
                  </span>
                  <Dialog.Title asChild>
                    <h2>
                      Activa
                      <br />
                      <span>{plan.label}.</span>
                    </h2>
                  </Dialog.Title>
                  <p>
                    Elegiste <strong>{plan.label}</strong>{" "}
                    {plan.audience === "student"
                      ? "con tarifa estudiante"
                      : "para público general"}
                    . Sigue estos pasos y el equipo te ayudará a comenzar.
                  </p>
                </div>

                <div className="enrollment-modal__grid">
                  <div className="modal-steps">
                    {STEPS.map((step, i) => (
                      <article key={step.title}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <step.icon size={20} />
                          <h3>{step.title}</h3>
                          <p>
                            {step.text}
                            {i === 0 && plan.studentRequirement
                              ? " Adjunta también tu certificado de alumno regular."
                              : ""}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <aside className="modal-transfer">
                    <div className="modal-transfer__head">
                      <div>
                        <span>Transferencia</span>
                        <h3>{plan.price}</h3>
                      </div>
                      <CreditCard size={22} />
                    </div>
                    <div className="transfer-command__data">
                      {transferData.map(([label, value]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                          <button
                            type="button"
                            aria-label={`Copiar ${label}`}
                            onClick={() => copyValue(label, value)}
                          >
                            {copied === label ? (
                              <Check size={15} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="transfer-command__foot">
                      <Mail size={16} />
                      <span>
                        Envía el comprobante a{" "}
                        <strong>plazafitnesschile@gmail.com</strong>
                      </span>
                    </div>
                    <a
                      href={buildWhatsappLink(
                        `Hola Plaza Fitness, quiero activar el plan ${plan.label} (${plan.price}). Ya tengo mis datos y necesito los siguientes pasos.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="button button--cobalt"
                    >
                      Continuar por WhatsApp <ArrowUpRight size={16} />
                    </a>
                  </aside>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
