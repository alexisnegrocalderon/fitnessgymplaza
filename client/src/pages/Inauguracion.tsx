import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  PartyPopper,
  Ticket,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { calm, spring } from "@/lib/motion";
import { formatCLP } from "@shared/format";
import {
  EVENT_DETAILS,
  EVENT_PRICE_CLP,
  registrationSchema,
  type RegistrationInput,
} from "@shared/registration";

type PriceBreakdown = {
  basePrice: number;
  serviceCharge: number;
  total: number;
};

type ViewState =
  | "form"
  | "payment"
  | "success"
  | "duplicate"
  | "full"
  | "mp_unavailable";

/** Payload que entrega el Payment Brick en su onSubmit — se reenvía tal
 * cual a api/pay.ts, que a su vez lo pasa a la API de Mercado Pago. */
type BrickFormData = Record<string, unknown>;

export default function Inauguracion() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<ViewState>("form");
  const [submitting, setSubmitting] = useState(false);
  const [checkingCapacity, setCheckingCapacity] = useState(true);
  const [contact, setContact] = useState<RegistrationInput | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  useEffect(() => {
    if (view !== "payment" || publicKey) return;
    let cancelled = false;
    fetch("/api/mercadopago-public-key")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return;
        initMercadoPago(data.publicKey);
        setPublicKey(data.publicKey);
      })
      .catch(() => {
        if (!cancelled) setView("mp_unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [view, publicKey]);

  useEffect(() => {
    if (view !== "payment" || pricing) return;
    let cancelled = false;
    fetch("/api/event-pricing")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (!cancelled) setPricing(data);
      })
      .catch(() => {
        if (!cancelled)
          setPricing({
            basePrice: EVENT_PRICE_CLP,
            serviceCharge: 0,
            total: EVENT_PRICE_CLP,
          });
      });
    return () => {
      cancelled = true;
    };
  }, [view, pricing]);

  function onContactSubmit(data: RegistrationInput) {
    setContact(data);
    setPaymentError(null);
    setView("payment");
  }

  async function onPaymentSubmit(formData: BrickFormData) {
    if (!contact) return;
    setSubmitting(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, formData }),
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
      if (json.ok) {
        setView("success");
        return;
      }

      setPaymentError(
        json.status === "rejected"
          ? "El pago fue rechazado. Verifica los datos de tu tarjeta o intenta con otro medio de pago."
          : "El pago quedó en proceso de confirmación. Te avisaremos por correo apenas se confirme."
      );
    } catch {
      setPaymentError("No se pudo procesar el pago. Intenta de nuevo.");
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
                onSubmit={handleSubmit(onContactSubmit)}
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
                <button type="submit" className="button button--cobalt">
                  Continuar al pago
                </button>
                <p className="inauguracion__fineprint">
                  Cupos limitados, valor {EVENT_DETAILS.price}. El siguiente
                  paso es el pago — tu cupo queda confirmado apenas se apruebe.
                  ¡Los esperamos!
                </p>
              </motion.form>
            ) : view === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={calm}
                className="inauguracion__payment"
              >
                {pricing && (
                  <div className="inauguracion__breakdown">
                    <div>
                      <span>Valor entrada</span>
                      <span>{formatCLP(pricing.basePrice)}</span>
                    </div>
                    {pricing.serviceCharge > 0 && (
                      <div>
                        <span>Cargo por servicio</span>
                        <span>{formatCLP(pricing.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="inauguracion__breakdown-total">
                      <span>Total a pagar</span>
                      <span>{formatCLP(pricing.total)}</span>
                    </div>
                  </div>
                )}
                {paymentError && (
                  <p className="inauguracion__payment-error">
                    <AlertTriangle size={14} /> {paymentError}
                  </p>
                )}
                {publicKey && pricing ? (
                  <Payment
                    initialization={{
                      amount: pricing.total,
                      payer: { email: contact?.email },
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: "all",
                        debitCard: "all",
                      },
                    }}
                    onSubmit={async ({ formData }) => {
                      await onPaymentSubmit(
                        formData as unknown as BrickFormData
                      );
                    }}
                  />
                ) : (
                  <p className="inauguracion__payment-loading">
                    Cargando el formulario de pago…
                  </p>
                )}
                {submitting && (
                  <p className="inauguracion__payment-loading">
                    Procesando tu pago…
                  </p>
                )}
              </motion.div>
            ) : view === "mp_unavailable" ? (
              <motion.div
                key="mp_unavailable"
                className="inauguracion__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <AlertTriangle size={32} />
                <h2>Pagos no disponibles por ahora</h2>
                <p>
                  Estamos ajustando el sistema de pago. Escríbenos por WhatsApp
                  y te ayudamos a confirmar tu cupo.
                </p>
              </motion.div>
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
                  Tu pago fue aprobado y tu cupo quedó confirmado. Te enviamos
                  un correo con los detalles — gracias por celebrar con
                  nosotros. ¡Los esperamos!
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
