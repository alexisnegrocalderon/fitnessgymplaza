import { useEffect } from "react";
import { cancelFrame, frame } from "framer-motion";
import Lenis from "lenis";

let sharedLenis: Lenis | null = null;

export function getLenis() {
  return sharedLenis;
}

/**
 * Scroll suave global.
 *
 * Lenis y Framer Motion se conducen desde el MISMO reloj: si Lenis corre su
 * propio rAF, `useScroll` lee la posición nativa del scroll y va un frame
 * detrás de la posición suavizada, lo que hace vibrar el parallax.
 */
export function useLenis() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: t => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    sharedLenis = lenis;

    // Un solo loop: el de Framer Motion conduce a Lenis.
    const update = ({ timestamp }: { timestamp: number }) =>
      lenis.raf(timestamp);
    frame.update(update, true);

    // Lenis se apropia de la navegación por anclas (index.css ya no usa
    // scroll-behavior: smooth, así que no hay dos motores compitiendo).
    function onAnchorClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey
      )
        return;

      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      );
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72 });
    }

    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelFrame(update);
      document.removeEventListener("click", onAnchorClick);
      lenis.destroy();
      sharedLenis = null;
    };
  }, []);
}
