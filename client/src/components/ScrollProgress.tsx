import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.2 });

  return (
    <div className="scroll-progress" aria-hidden="true">
      <motion.div className="scroll-progress__bar" style={{ scaleX: progress }} />
    </div>
  );
}
