import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { GRIP_IMAGE, WHATSAPP_URL, plans } from "@/lib/gym-content";
import {
  calm,
  nearestSnap,
  project,
  rubberband,
  spring,
  tick,
} from "@/lib/motion";

/** Movimiento necesario antes de comprometerse a un arrastre horizontal. */
const DRAG_THRESHOLD = 10;
/** Ventana de muestras para calcular la velocidad de salida. */
const VELOCITY_WINDOW_MS = 100;

type Sample = { x: number; t: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article
      className={`plan-card-h ${plan.featured ? "plan-card-h--featured" : ""}`}
    >
      <div className="plan-card__top">
        <span>{plan.number}</span>
        <Plus size={17} />
      </div>
      <div className="plan-card__body">
        <span className="plan-card__kicker">{plan.kicker}</span>
        <h3>{plan.title}</h3>
        <p>{plan.description}</p>
        <ul>
          {plan.features.map(feature => (
            <li key={feature}>
              <Check size={15} /> {feature}
            </li>
          ))}
        </ul>
      </div>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="plan-card__link"
      >
        Consultar disponibilidad <ArrowUpRight size={16} />
      </a>
      {plan.featured && <span className="plan-card__badge">Recomendado</span>}
    </article>
  );
}

/**
 * Carrusel de planes conducido por gesto.
 *
 * Reemplaza el scroll-jack de escritorio y la pila estática de móvil por una
 * sola pieza que sigue al dedo 1:1, proyecta el momentum al soltar, entrega la
 * velocidad al resorte y resiste en los extremos en vez de frenar en seco.
 * Cualquier animación en curso puede interrumpirse: un nuevo pointerdown lee
 * el valor en pantalla y toma el control desde ahí.
 */
export default function PlansCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const reduced = useReducedMotion();

  const [snapPoints, setSnapPoints] = useState<number[]>([0]);
  const [maxShift, setMaxShift] = useState(0);
  const [index, setIndex] = useState(0);

  const drag = useRef({
    active: false,
    committed: false,
    startPointer: 0,
    startX: 0,
    samples: [] as Sample[],
  });
  const wheelTimer = useRef<number>(0);

  // El indicador es una pastilla que recorre el riel, no una barra que crece:
  // comunica posición dentro del set, no cantidad consumida.
  const slideCount = plans.length + 1;
  const railX = useTransform(
    x,
    [0, -Math.max(maxShift, 1)],
    ["0%", `${(slideCount - 1) * 100}%`],
    {
      clamp: true,
    }
  );

  /** Mide dónde debe quedar cada tarjeta. Se realinea con fuentes y resize. */
  const measure = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const shift = Math.max(track.scrollWidth - viewport.clientWidth, 0);
    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-snap]")
    );
    if (!cards.length) return;

    const base = cards[0].offsetLeft;
    const points = cards.map(card =>
      clamp(-(card.offsetLeft - base), -shift, 0)
    );

    setMaxShift(shift);
    setSnapPoints(Array.from(new Set(points)).sort((a, b) => b - a));
    x.set(clamp(x.get(), -shift, 0));
  }, [x]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    if (viewportRef.current) observer.observe(viewportRef.current);
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [measure]);

  const settleTo = useCallback(
    (target: number, velocity = 0) => {
      const nextIndex = snapPoints.indexOf(target);
      if (nextIndex !== -1 && nextIndex !== index) {
        setIndex(nextIndex);
        tick();
      }
      animate(x, target, reduced ? calm : { ...spring.momentum, velocity });
    },
    [index, reduced, snapPoints, x]
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // Arrancar desde el valor en pantalla, no desde el destino lógico:
    // así se puede agarrar el track en pleno vuelo sin ningún salto.
    x.stop();
    drag.current = {
      active: true,
      committed: false,
      startPointer: event.clientX,
      startX: x.get(),
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state.active) return;

    const delta = event.clientX - state.startPointer;
    if (!state.committed) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      state.committed = true;
    }

    state.samples.push({ x: event.clientX, t: event.timeStamp });
    if (state.samples.length > 6) state.samples.shift();

    // 1:1 dentro de los límites, resistencia progresiva fuera de ellos.
    const raw = state.startX + delta;
    const width = viewportRef.current?.clientWidth ?? 1;
    if (raw > 0) x.set(rubberband(raw, width));
    else if (raw < -maxShift)
      x.set(-maxShift + rubberband(raw + maxShift, width));
    else x.set(raw);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (!state.committed) return;

    // Velocidad desde el historial reciente, no desde el último delta suelto.
    const samples = state.samples;
    const last = samples[samples.length - 1];
    const first =
      samples.find(s => last.t - s.t <= VELOCITY_WINDOW_MS) ?? samples[0];
    const elapsed = last.t - first.t;
    const velocity = elapsed > 0 ? ((last.x - first.x) / elapsed) * 1000 : 0;

    // Aterrizar donde iba el gesto, no donde se detuvo el dedo.
    const projected = clamp(x.get() + project(velocity), -maxShift, 0);
    settleTo(nearestSnap(projected, snapPoints), velocity);
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    // Un arrastre no debe disparar el enlace de la tarjeta.
    if (drag.current.committed) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.committed = false;
    }
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    x.stop();
    x.set(clamp(x.get() - event.deltaX, -maxShift, 0));
    window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(
      () => settleTo(nearestSnap(x.get(), snapPoints)),
      120
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    settleTo(snapPoints[clamp(index + step, 0, snapPoints.length - 1)]);
  }

  return (
    <div className="plans-carousel">
      <div
        ref={viewportRef}
        className="plans-carousel__viewport"
        role="group"
        aria-roledescription="carrusel"
        aria-label="Planes de entrenamiento"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <motion.div
          ref={trackRef}
          className="plans-carousel__track"
          style={{ x }}
        >
          {plans.map(plan => (
            <div className="plans-carousel__slide" data-snap key={plan.number}>
              <PlanCard plan={plan} />
            </div>
          ))}
          <div
            className="plans-carousel__slide plans-carousel__slide--accent"
            data-snap
          >
            <div className="plans-track-h__accent">
              <img
                src={GRIP_IMAGE}
                alt="Piso de entrenamiento de Plaza Fitness con el mezzanine y la instalación de luces al fondo"
                loading="lazy"
                draggable={false}
              />
              <div className="plans-grid__accent-copy">
                <span>04</span>
                <strong>El plan es moverte.</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="plans-carousel__rail" aria-hidden="true">
        <motion.span
          className="plans-carousel__rail-thumb"
          style={{ x: railX, width: `${100 / slideCount}%` }}
        />
      </div>
    </div>
  );
}
