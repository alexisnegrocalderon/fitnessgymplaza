import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  UserRound,
} from "lucide-react";
import { BrandMark } from "@/components/common";
import { calm, spring } from "@/lib/motion";
import { formatCLP } from "@shared/format";
import { formatRut, isValidRut } from "@shared/rut";
import {
  planPurchaseSchema,
  type PlanPurchaseInput,
} from "@shared/planPurchase";
import {
  PLAN_TIERS,
  plans,
  type Audience,
  type Plan,
  type PlanTier,
} from "@shared/plans";

const STEP_ORDER = [
  "audience",
  "tier",
  "name",
  "rut",
  "whatsapp",
  "email",
] as const;
type QuestionStep = (typeof STEP_ORDER)[number];
type Phase =
  | QuestionStep
  | "payment"
  | "success"
  | "duplicate"
  | "mp_unavailable";

type PriceBreakdown = {
  basePrice: number;
  serviceCharge: number;
  total: number;
};

/** Lee ?audience=&tier= del URL para saltar directo al nombre desde una
 * tarjeta específica del home (Plans.tsx la arma así). */
function readQueryPlan(): { audience: Audience; tier: PlanTier } | null {
  const params = new URLSearchParams(window.location.search);
  const audience = params.get("audience");
  const tier = params.get("tier");
  const validAudience = audience === "general" || audience === "student";
  const validTier = (PLAN_TIERS as readonly string[]).includes(tier ?? "");
  return validAudience && validTier
    ? { audience: audience as Audience, tier: tier as PlanTier }
    : null;
}

/** Payload que entrega el Payment Brick en su onSubmit — se reenvía tal
 * cual a api/plan-pay.ts, que a su vez lo pasa a la API de Mercado Pago. */
type BrickFormData = Record<string, unknown>;

/** Mismo mecanismo de reveal palabra por palabra que el titular del Hero
 * (client/src/components/sections/Hero.tsx) — reutiliza sus clases CSS
 * .hero-word/.hero-word__inner tal cual, sin CSS nuevo. */
function StepWords({ text }: { text: string }) {
  const tokens = text.split(" ");
  return (
    <>
      {tokens.map((token, i) => (
        <span key={`${token}-${i}`}>
          <span className="hero-word">
            <motion.span
              className="hero-word__inner"
              variants={{
                hidden: { opacity: 0, y: "0.4em" },
                visible: { opacity: 1, y: 0 },
              }}
              transition={spring.reveal}
            >
              {token}
            </motion.span>
          </span>
          {i < tokens.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/** Título de cada paso: se construye palabra por palabra, más ágil que el
 * reveal del Hero porque dispara en cada cambio de paso, no una sola vez. */
function StepTitle({ text, style }: { text: string; style?: CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.h1
      style={style}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : 0.04,
            delayChildren: reduced ? 0 : 0.04,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      <StepWords text={text} />
    </motion.h1>
  );
}

export default function Planes() {
  const reduced = useReducedMotion();
  const deepLink = readQueryPlan();

  const [phase, setPhase] = useState<Phase>(deepLink ? "name" : "audience");
  const [audience, setAudience] = useState<Audience | null>(
    deepLink?.audience ?? null
  );
  const [pickedAudience, setPickedAudience] = useState<Audience | null>(null);
  const [tier, setTier] = useState<PlanTier | null>(deepLink?.tier ?? null);
  const [fullName, setFullName] = useState("");
  const [rut, setRut] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const plan: Plan | null =
    audience && tier
      ? (plans.find(p => p.audience === audience && p.tier === tier) ?? null)
      : null;

  useEffect(() => {
    if (phase !== "payment" || publicKey) return;
    let cancelled = false;
    fetch("/api/mercadopago-public-key")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return;
        initMercadoPago(data.publicKey);
        setPublicKey(data.publicKey);
      })
      .catch(() => {
        if (!cancelled) setPhase("mp_unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, publicKey]);

  useEffect(() => {
    if (phase !== "payment" || pricing || !audience || !tier) return;
    let cancelled = false;
    fetch(`/api/plan-pricing?audience=${audience}&tier=${tier}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (!cancelled) setPricing(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [phase, pricing, audience, tier]);

  function goBack() {
    if (phase === "payment") {
      setPaymentError(null);
      setPhase("email");
      return;
    }
    const index = STEP_ORDER.indexOf(phase as QuestionStep);
    if (index > 0) {
      setFieldError(null);
      setPhase(STEP_ORDER[index - 1]);
    }
  }

  function selectAudience(next: Audience) {
    setPickedAudience(next);
    setAudience(next);
    window.setTimeout(() => setPhase("tier"), 180);
  }

  function selectTier(next: PlanTier) {
    setTier(next);
    setPhase("name");
  }

  function validateAndAdvance(step: QuestionStep) {
    if (step === "name") {
      const result = planPurchaseSchema.shape.fullName.safeParse(fullName);
      if (!result.success) {
        setFieldError(result.error.issues[0].message);
        return;
      }
      setFieldError(null);
      setPhase("rut");
      return;
    }
    if (step === "rut") {
      if (!isValidRut(rut)) {
        setFieldError(
          "RUT inválido — revisa el número y el dígito verificador"
        );
        return;
      }
      setFieldError(null);
      setPhase("whatsapp");
      return;
    }
    if (step === "whatsapp") {
      const result = planPurchaseSchema.shape.whatsapp.safeParse(whatsapp);
      if (!result.success) {
        setFieldError(result.error.issues[0].message);
        return;
      }
      setFieldError(null);
      setPhase("email");
      return;
    }
    if (step === "email") {
      const result = planPurchaseSchema.shape.email.safeParse(email);
      if (!result.success) {
        setFieldError(result.error.issues[0].message);
        return;
      }
      setFieldError(null);
      void submitLead();
    }
  }

  async function submitLead() {
    if (!audience || !tier) return;
    setSubmittingLead(true);
    try {
      const payload: PlanPurchaseInput = {
        fullName,
        rut,
        whatsapp,
        email,
        audience,
        tier,
      };
      const res = await fetch("/api/plan-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (json.alreadyPurchased) {
        setPhase("duplicate");
        return;
      }
      if (!res.ok) throw new Error("request_failed");
      setPhase("payment");
    } catch {
      setFieldError("No se pudo guardar tus datos. Intenta de nuevo.");
    } finally {
      setSubmittingLead(false);
    }
  }

  async function onPaymentSubmit(formData: BrickFormData) {
    if (!audience || !tier) return;
    setSubmittingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/plan-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          rut,
          whatsapp,
          email,
          audience,
          tier,
          formData,
        }),
      });
      const json = await res.json();
      if (json.alreadyPurchased) {
        setPhase("duplicate");
        return;
      }
      if (json.ok) {
        setPhase("success");
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
      setSubmittingPayment(false);
    }
  }

  const transition = reduced ? calm : spring.reveal;
  const questionIndex = STEP_ORDER.includes(phase as QuestionStep)
    ? STEP_ORDER.indexOf(phase as QuestionStep)
    : -1;
  const showProgress = questionIndex >= 0;
  const showBack = phase === "payment" || questionIndex > 0;

  const stepMotion = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: calm,
      }
    : {
        initial: { opacity: 0, y: 14, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(4px)" },
        transition: spring.ui,
      };

  return (
    <div className="immersive-flow">
      <div className="immersive-flow__glow" aria-hidden="true" />
      <div className="immersive-flow__grid" aria-hidden="true" />
      <BrandMark className="immersive-flow__mark" decorative />
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

        <div className="immersive-flow__panel glass-card">
          {showProgress && (
            <div className="immersive-flow__progress">
              {showBack ? (
                <button
                  type="button"
                  className="immersive-flow__back"
                  onClick={goBack}
                  aria-label="Volver"
                >
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <span style={{ width: 34 }} aria-hidden="true" />
              )}
              <div className="immersive-flow__progress-track">
                <motion.div
                  className="immersive-flow__progress-bar"
                  animate={{
                    width: `${((questionIndex + 1) / STEP_ORDER.length) * 100}%`,
                  }}
                  transition={reduced ? calm : spring.ui}
                />
              </div>
              <span className="immersive-flow__progress-count">
                {questionIndex + 1}/{STEP_ORDER.length}
              </span>
            </div>
          )}
          {!showProgress && showBack && (
            <div className="immersive-flow__progress">
              <button
                type="button"
                className="immersive-flow__back"
                onClick={goBack}
                aria-label="Volver"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {phase === "audience" ? (
              <motion.div key="audience" {...stepMotion}>
                <StepTitle text="¿Eres estudiante?" />
                <p
                  className="immersive-flow__lede"
                  style={{ margin: "10px 0 22px" }}
                >
                  Así te mostramos la tarifa correcta.
                </p>
                <div className="immersive-flow__split">
                  <motion.button
                    type="button"
                    className={`immersive-flow__split-half ${pickedAudience === "general" ? "is-active" : ""}`}
                    onClick={() => selectAudience("general")}
                    whileTap={{ scale: 0.97 }}
                  >
                    {pickedAudience === "general" && (
                      <motion.span
                        layoutId="audience-fill"
                        className="immersive-flow__split-fill"
                        transition={reduced ? calm : spring.ui}
                      />
                    )}
                    <span className="immersive-flow__split-icon">
                      <UserRound size={18} />
                    </span>
                    <strong>No</strong>
                    <small>Alumno regular</small>
                  </motion.button>
                  <motion.button
                    type="button"
                    className={`immersive-flow__split-half ${pickedAudience === "student" ? "is-active" : ""}`}
                    onClick={() => selectAudience("student")}
                    whileTap={{ scale: 0.97 }}
                  >
                    {pickedAudience === "student" && (
                      <motion.span
                        layoutId="audience-fill"
                        className="immersive-flow__split-fill"
                        transition={reduced ? calm : spring.ui}
                      />
                    )}
                    <span className="immersive-flow__split-icon">
                      <ClipboardCheck size={18} />
                    </span>
                    <strong>Sí</strong>
                    <small>Cuento con certificado de alumno regular</small>
                  </motion.button>
                </div>
              </motion.div>
            ) : phase === "tier" ? (
              <motion.div key="tier" {...stepMotion}>
                <StepTitle text="¿Cuántas clases quieres al mes?" />
                <p
                  className="immersive-flow__lede"
                  style={{ margin: "10px 0 22px" }}
                >
                  Elige el ritmo que más te acomode — o ahorra con un pack.
                </p>
                <div className="immersive-flow__options">
                  {PLAN_TIERS.map(t => {
                    const optionPlan = plans.find(
                      p => p.audience === audience && p.tier === t
                    );
                    return (
                      <motion.button
                        key={t}
                        type="button"
                        className="immersive-flow__option"
                        onClick={() => selectTier(t)}
                        whileTap={{ scale: 0.98 }}
                        whileHover={reduced ? undefined : { y: -2 }}
                      >
                        <span className="immersive-flow__option-body">
                          <strong>{optionPlan?.label}</strong>
                          <small>{optionPlan?.tagline}</small>
                        </span>
                        <span className="immersive-flow__option-price">
                          {optionPlan?.price}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : phase === "name" ? (
              <motion.form
                key="name"
                {...stepMotion}
                onSubmit={e => {
                  e.preventDefault();
                  validateAndAdvance("name");
                }}
              >
                <StepTitle text="¿Cuál es tu nombre completo?" />
                <label
                  className="immersive-flow__field"
                  style={{ marginTop: 18 }}
                >
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    autoComplete="name"
                    autoFocus
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                  {fieldError && <em>{fieldError}</em>}
                </label>
                <button type="submit" className="button button--cobalt">
                  Continuar <ArrowRight size={16} />
                </button>
              </motion.form>
            ) : phase === "rut" ? (
              <motion.form
                key="rut"
                {...stepMotion}
                onSubmit={e => {
                  e.preventDefault();
                  validateAndAdvance("rut");
                }}
              >
                <StepTitle text="¿Cuál es tu RUT?" />
                <label
                  className="immersive-flow__field"
                  style={{ marginTop: 18 }}
                >
                  <span>RUT</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoFocus
                    placeholder="12.345.678-9"
                    value={rut}
                    onChange={e => setRut(formatRut(e.target.value))}
                  />
                  {fieldError && <em>{fieldError}</em>}
                </label>
                <button type="submit" className="button button--cobalt">
                  Continuar <ArrowRight size={16} />
                </button>
              </motion.form>
            ) : phase === "whatsapp" ? (
              <motion.form
                key="whatsapp"
                {...stepMotion}
                onSubmit={e => {
                  e.preventDefault();
                  validateAndAdvance("whatsapp");
                }}
              >
                <StepTitle text="¿Cuál es tu WhatsApp?" />
                <label
                  className="immersive-flow__field"
                  style={{ marginTop: 18 }}
                >
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    autoFocus
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                  />
                  {fieldError && <em>{fieldError}</em>}
                </label>
                <button type="submit" className="button button--cobalt">
                  Continuar <ArrowRight size={16} />
                </button>
              </motion.form>
            ) : phase === "email" ? (
              <motion.form
                key="email"
                {...stepMotion}
                onSubmit={e => {
                  e.preventDefault();
                  validateAndAdvance("email");
                }}
              >
                <StepTitle text="¿Cuál es tu email?" />
                <label
                  className="immersive-flow__field"
                  style={{ marginTop: 18 }}
                >
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  {fieldError && <em>{fieldError}</em>}
                </label>
                <p className="immersive-flow__fineprint">
                  Ingresa un mail válido — ahí llegará tu confirmación del plan.
                </p>
                <button
                  type="submit"
                  className="button button--cobalt"
                  disabled={submittingLead}
                >
                  {submittingLead ? "Guardando…" : "Continuar al pago"}
                </button>
              </motion.form>
            ) : phase === "payment" ? (
              <motion.div key="payment" {...stepMotion}>
                <StepTitle
                  text="Pago seguro con Mercado Pago"
                  style={{ fontSize: "clamp(26px, 6vw, 40px)" }}
                />
                {pricing && plan && (
                  <div
                    className="immersive-flow__breakdown"
                    style={{ marginTop: 18 }}
                  >
                    <div>
                      <span>{plan.label}</span>
                      <span>{formatCLP(pricing.basePrice)}</span>
                    </div>
                    {pricing.serviceCharge > 0 && (
                      <div>
                        <span>Cargo por servicio</span>
                        <span>{formatCLP(pricing.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="immersive-flow__breakdown-total">
                      <span>Total a pagar</span>
                      <span>{formatCLP(pricing.total)}</span>
                    </div>
                  </div>
                )}
                {paymentError && (
                  <p className="immersive-flow__payment-error">
                    <AlertTriangle size={14} /> {paymentError}
                  </p>
                )}
                {publicKey && pricing ? (
                  <Payment
                    initialization={{
                      amount: pricing.total,
                      payer: { email },
                    }}
                    customization={{
                      paymentMethods: { creditCard: "all", debitCard: "all" },
                    }}
                    onSubmit={async ({ formData }) => {
                      await onPaymentSubmit(
                        formData as unknown as BrickFormData
                      );
                    }}
                  />
                ) : (
                  <p className="immersive-flow__payment-loading">
                    Cargando el formulario de pago…
                  </p>
                )}
                {submittingPayment && (
                  <p className="immersive-flow__payment-loading">
                    Procesando tu pago…
                  </p>
                )}
              </motion.div>
            ) : phase === "mp_unavailable" ? (
              <motion.div
                key="mp_unavailable"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <AlertTriangle size={32} />
                <h2>Pagos no disponibles por ahora</h2>
                <p>
                  Estamos ajustando el sistema de pago. Escríbenos por WhatsApp
                  y te ayudamos a activar tu plan.
                </p>
              </motion.div>
            ) : phase === "success" ? (
              <motion.div
                key="success"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>¡Tu plan está activo!</h2>
                <p>
                  Tu pago fue aprobado. Te enviamos un correo con los detalles
                  de tu plan {plan?.label ?? ""} — ¡nos vemos en Plaza Fitness!
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="duplicate"
                className="immersive-flow__result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm}
              >
                <CheckCircle2 size={32} />
                <h2>Ya tienes un plan activo</h2>
                <p>Ya tenemos una compra registrada con estos datos.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
