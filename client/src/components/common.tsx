import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { MARK_URL, WHATSAPP_URL } from "@/lib/gym-content";
import { spring } from "@/lib/motion";

export function BrandMark({
  className = "",
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <img
      src={MARK_URL}
      alt={decorative ? "" : "Plaza Fitness"}
      aria-hidden={decorative ? true : undefined}
      className={`brand-mark ${className}`}
    />
  );
}

export function SectionTag({
  children,
  light = false,
}: {
  children: string;
  light?: boolean;
}) {
  return (
    <div className={`section-tag ${light ? "section-tag--light" : ""}`}>
      <span className="section-tag__line" />
      <span>{children}</span>
    </div>
  );
}

/** Cuánto se deja arrastrar el botón hacia el puntero, en px. */
const MAGNET_PULL = 7;

/**
 * El único destino de conversión del sitio. Recibe el trato más cuidado:
 * feedback en el pointer-down (no al soltar) y una atracción magnética local
 * en escritorio, que reemplaza al cursor personalizado que se eliminó.
 */
export function WhatsAppButton({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  const magnetX = useSpring(useMotionValue(0), spring.ui);
  const magnetY = useSpring(useMotionValue(0), spring.ui);
  const scale = useSpring(useMotionValue(1), spring.press);

  function onPointerMove(event: React.PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    magnetX.set(
      ((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) *
        MAGNET_PULL
    );
    magnetY.set(
      ((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) *
        MAGNET_PULL
    );
  }

  function release() {
    magnetX.set(0);
    magnetY.set(0);
    scale.set(1);
  }

  return (
    <motion.a
      ref={ref}
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      className={`button button--cobalt ${compact ? "button--compact" : ""}`}
      style={{ x: magnetX, y: magnetY, scale }}
      onPointerMove={onPointerMove}
      onPointerDown={() => scale.set(0.97)}
      onPointerUp={() => scale.set(1)}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      <MessageCircle size={compact ? 16 : 18} strokeWidth={2.2} />
      <span>Conversemos</span>
      <ArrowUpRight size={16} />
    </motion.a>
  );
}
