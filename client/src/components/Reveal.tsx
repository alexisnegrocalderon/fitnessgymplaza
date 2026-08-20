import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { calm, spring } from "@/lib/motion";

type RevealKind = "rise" | "mask" | "fade" | "scale";

const variantsByKind: Record<RevealKind, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  mask: {
    hidden: { opacity: 0, x: -22 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
};

/** Con movimiento reducido nada viaja: solo aparece. */
const fadeOnly: Variants = variantsByKind.fade;

export function Reveal({
  children,
  kind = "rise",
  delay = 0,
  className = "",
  once = true,
  amount = 0.3,
}: {
  children: ReactNode;
  kind?: RevealKind;
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduced ? fadeOnly : variantsByKind[kind]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{
        ...(reduced ? calm : spring.reveal),
        delay: reduced ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className = "",
  stagger = 0.09,
  once = true,
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduced = useReducedMotion();

  // El stagger tiene que vivir en `variants` del padre: puesto solo en
  // `transition` nunca se propaga a los hijos y la lista entra de golpe.
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  kind = "rise",
  className = "",
}: {
  children: ReactNode;
  kind?: RevealKind;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduced ? fadeOnly : variantsByKind[kind]}
      transition={reduced ? calm : spring.reveal}
    >
      {children}
    </motion.div>
  );
}
