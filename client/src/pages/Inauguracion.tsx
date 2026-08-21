import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  PartyPopper,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { calm, spring } from "@/lib/motion";
import {
  EVENT_DETAILS,
  registrationSchema,
  type RegistrationInput,
} from "@shared/registration";

type ViewState = "form" | "success" | "duplicate" | "resent" | "full";

export default function Inauguracion() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<ViewState>("form");
  const [submittingContact, setSubmittingContact] = useState(false);
  const [checkingCapacity, setCheckingCapacity] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deliveryIssue, setDeliveryIssue] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema) });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/registration-status")
      .then(res => (res.ok ? res.json() : { full: false }))
      .then(data => {
        if (!cancelled && data.full) setView("full");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingCapacity(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onContactSubmit(data: RegistrationInput, resend = false) {
    setSubmittingContact(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, resend }),
      });

      if (res.status === 409) {
        setView("full");
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "email_delivery_failed") {
          setDeliveryIssue(true);
          setView("duplicate");
          return;
        }
        setSubmitError("No pudimos completar la inscripción. Intenta nuevamente.");
        return;
      }
      if (json.alreadyRegistered) {
        setDeliveryIssue(false);
        setView(json.emailResent ? "resent" : "duplicate");
        return;
      }

      setDeliveryIssue(false);
      setView("success");
    } catch {
      setSubmitError("No se pudo guardar tus datos. Intenta de nuevo.");
    } finally {
      setSubmittingContact(false);
    }
  }

  const transition = reduced ? calm : spring.reveal;

  return (
    <div className="immersive-flow">
      <div className="immersive-flow__glow" aria-hidden="true" />
      <div className="immersive-flow__content">
        <motion.a
          href="/"
          className="immersive-flow__brand"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <BrandMark className="brand-mark--stamp" />
        </motion.a>

        <motion.div
          className="immersive-flow__eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : { ...spring.ui, delay: 0.06 }}
        >
          <PartyPopper size={14} /> Cupos limitados
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : { ...spring.reveal, delay: 0.12 }}
        >
          Gran <em>Inauguración</em>
        </motion.h1>

        <motion.p
          className="immersive-flow__lede"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : { ...spring.reveal, delay: 0.18 }}
        >
          Volvimos a nuestra casa oficial, y no podríamos estar más felices de
          celebrarlo junto a ustedes. Gracias por el apoyo de siempre y por ser
          parte de esta gran familia que es Plaza Fitness.
        </motion.p>

        <motion.div
          className="immersive-flow__meta"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : { ...spring.reveal, delay: 0.26 }}
        >
          <span>
            <CalendarDays size={15} /> {EVENT_DETAILS.date} ·{" "}
            {EVENT_DETAILS.time}
          </span>
          <span>
            <MapPin size={15} /> {EVENT_DETAILS.address}
          </span>
        </motion.div>

        <motion.div
          className="immersive-flow__panel glass-card"
          initial={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.96, filter: "blur(8px)" }
          }
          animate={
            reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, filter: "blur(0px)" }
          }
          transition={reduced ? calm : { ...spring.reveal, delay: 0.32 }}
        >
          <AnimatePresence mode="wait">
            {checkingCapacity ? null : view === "form" ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit(data => onContactSubmit(data))}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={calm}
                noValidate
              >
                <label className="immersive-flow__field">
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    autoComplete="name"
                    {...register("fullName")}
                  />
                  {errors.fullName && <em>{errors.fullName.message}</em>}
                </label>
                <label className="immersive-flow__field">
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email && <em>{errors.email.message}</em>}
                </label>
                <label className="immersive-flow__field">
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    {...register("whatsapp")}
                  />
                  {errors.whatsapp && <em>{errors.whatsapp.message}</em>}
                </label>
                {submitError && (
                  <p className="immersive-flow__payment-error">
                    <AlertTriangle size={14} /> {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  className="button button--cobalt"
                  disabled={submittingContact}
                >
                  {submittingContact ? "Guardando…" : "¡Nos vemos ahí!"}
                </button>
                <p className="immersive-flow__fineprint">
                  Cupos limitados. Tu inscripción queda confirmada al instante —
                  ¡los esperamos!
                </p>
              </motion.form>
            ) : view === "success" ? (
              <motion.div
                key="success"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>¡Tu inscripción quedó confirmada!</h2>
                <p>
                  Te enviamos un correo con los detalles — gracias por celebrar
                  con nosotros. ¡Los esperamos!
                </p>
              </motion.div>
            ) : view === "duplicate" ? (
              <motion.div
                key="duplicate"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>Ya estás inscrito</h2>
                <p>
                  {deliveryIssue
                    ? "Tu inscripción quedó guardada, pero no pudimos confirmar el correo. Puedes reenviar la invitación."
                    : "Ya tenemos tu inscripción registrada con estos datos. Si no ves la invitación, puedes reenviarla."}
                </p>
                <button
                  type="button"
                  className="button button--cobalt"
                  disabled={submittingContact}
                  onClick={handleSubmit(data => onContactSubmit(data, true))}
                >
                  {submittingContact ? "Reenviando…" : "Reenviar invitación"}
                </button>
              </motion.div>
            ) : view === "resent" ? (
              <motion.div
                key="resent"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>Invitación reenviada</h2>
                <p>Revisa también spam o promociones si no la ves en unos minutos.</p>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <h2>Cupos completos</h2>
                <p>
                  Ya no estamos recibiendo más inscripciones para este evento.
                  ¡Gracias por el interés — nos vemos en Plaza Fitness pronto!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
