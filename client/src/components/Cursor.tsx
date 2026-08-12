import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [data-cursor]";
const MAGNETIC_RADIUS = 90;
const MAGNETIC_STRENGTH = 0.35;

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsFinePointer || prefersReducedMotion) return;

    document.documentElement.classList.add("has-custom-cursor");

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;

    const magnets: { el: HTMLElement; x: number; y: number }[] = [];

    function handleMove(event: MouseEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
      dot!.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      const magneticEls = document.querySelectorAll<HTMLElement>(".magnetic");
      magneticEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const distance = Math.hypot(dx, dy);
        if (distance < MAGNETIC_RADIUS) {
          const pull = (1 - distance / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
          el.style.transform = `translate3d(${dx * pull}px, ${dy * pull}px, 0)`;
        } else if (el.style.transform) {
          el.style.transform = "";
        }
      });
    }

    function handleOver(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.add("cursor-ring--active");
      }
    }

    function handleOut(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.remove("cursor-ring--active");
      }
    }

    function tick() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = requestAnimationFrame(tick);
    }

    let frame = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      document.documentElement.classList.remove("has-custom-cursor");
      magnets.forEach(({ el }) => (el.style.transform = ""));
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
