import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  PartyPopper,
  Ticket,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { calm, spring } from "@/lib/motion";
import {
  EVENT_DETAILS,
  registrationSchema,
  type RegistrationInput,
} from "@shared/registration";

type ViewState = "form" | "success" | "duplicate" | "full";

export default function Inauguracion() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<ViewState>("form");
  const [submitting, setSubmitting] = useState(false);
  const [checkingCapacity, setCheckingCapacity] = useState(true);

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

  async function onSubmit(data: RegistrationInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        setView("full");
        return;
      }

      const json = await res.json();
      if (json.alreadyRegistered) {
        setView("duplicate");
        return;
      }
      if (!res.ok) throw new Error("request_failed");

      setView("success");
    } catch {
      // El fetch falló (red, 5xx, etc): dejamos el formulario visible para reintentar.
    } finally {
      setSubmitting(false);
    }
  }

  const transition = reduced ? calm : spring.reveal;

  return (
    <div className="inauguracion">
      <div className="inauguracion__glow" aria-hidden="true" />
      <div className="inauguracion__content">
        <motion.a
          href="/"
          className="inauguracion__brand"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <BrandMark className="brand-mark--stamp" />
        </motion.a>

        <motion.div
          className="inauguracion__eyebrow"
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
          className="inauguracion__lede"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? calm : { ...spring.reveal, delay: 0.18 }}
        >
          Volvimos a nuestra casa oficial, y no podríamos estar más felices de
          celebrarlo junto a ustedes. Gracias por el apoyo de siempre y por ser
          parte de esta gran familia que es Plaza Fitness.
        </motion.p>

        <motion.div
          className="inauguracion__meta"
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
          <span>
            <Ticket size={15} /> {EVENT_DETAILS.price}
          </span>
        </motion.div>

        <motion.div
          className="inauguracion__panel glass-card"
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
                onSubmit={handleSubmit(onSubmit)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={calm}
                noValidate
              >
                <label className="inauguracion__field">
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    autoComplete="name"
                    {...register("fullName")}
                  />
                  {errors.fullName && <em>{errors.fullName.message}</em>}
                </label>
                <label className="inauguracion__field">
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email && <em>{errors.email.message}</em>}
                </label>
                <label className="inauguracion__field">
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    {...register("whatsapp")}
                  />
                  {errors.whatsapp && <em>{errors.whatsapp.message}</em>}
                </label>
                <button
                  type="submit"
                  className="button button--cobalt"
                  disabled={submitting}
                >
                  {submitting ? "Enviando…" : "Confirmar mi inscripción"}
                </button>
                <p className="inauguracion__fineprint">
                  Cupos limitados, valor {EVENT_DETAILS.price}. Tu inscripción
                  queda pendiente de aprobación — te llegará un correo de
                  confirmación. ¡Los esperamos!
                </p>
              </motion.form>
            ) : view === "success" ? (
              <motion.div
                key="success"
                className="inauguracion__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>¡Listo!</h2>
                <p>
                  Recibimos tu inscripción. Te avisaremos por correo apenas se
                  confirme tu cupo — gracias por celebrar con nosotros. ¡Los
                  esperamos!
                </p>
              </motion.div>
            ) : view === "duplicate" ? (
              <motion.div
                key="duplicate"
                className="inauguracion__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>Ya estás inscrito</h2>
                <p>Ya tenemos tu inscripción registrada con estos datos.</p>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                className="inauguracion__result"
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
