import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealKind = "rise" | "mask" | "fade" | "scale";

const variantsByKind: Record<RevealKind, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 46 },
    visible: { opacity: 1, y: 0 },
  },
  mask: {
    hidden: { opacity: 0, x: -28, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
};

export function Reveal({
  children,
  kind = "rise",
  delay = 0,
  duration = 0.8,
  className = "",
  once = true,
  amount = 0.3,
}: {
  children: ReactNode;
  kind?: RevealKind;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={variantsByKind[kind]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.23, 1, 0.32, 1] }}
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
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  kind = "rise",
  className = "",
  duration = 0.7,
}: {
  children: ReactNode;
  kind?: RevealKind;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={variantsByKind[kind]}
      transition={{ duration, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
