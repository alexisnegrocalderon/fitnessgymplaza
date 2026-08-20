import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Instagram, Menu, Phone, X } from "lucide-react";
import { BrandMark, WhatsAppButton } from "@/components/common";
import { INSTAGRAM_URL } from "@/lib/gym-content";

/** Distancia en la que la barra termina de materializarse. */
const MATERIALIZE_OVER = 120;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // La barra no conmuta entre dos estados: se materializa de forma continua
  // a medida que el contenido pasa por debajo.
  const range = [0, MATERIALIZE_OVER];
  const background = useTransform(scrollY, range, [
    "rgba(14, 17, 16, 0)",
    "rgba(14, 17, 16, 0.82)",
  ]);
  const backdropFilter = useTransform(scrollY, range, [
    "blur(0px)",
    "blur(18px)",
  ]);
  const minHeight = useTransform(scrollY, range, [78, 64]);
  const edge = useTransform(scrollY, range, [0, 1]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      className={`site-header ${menuOpen ? "site-header--menu-open" : ""}`}
      style={{
        background,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        minHeight,
      }}
    >
      {/* Borde de scroll en vez de una línea dura de 1px. */}
      <motion.span
        className="site-header__edge"
        style={{ opacity: edge }}
        aria-hidden="true"
      />
      <a
        href="#inicio"
        className="brand-lockup"
        aria-label="Plaza Fitness, volver al inicio"
      >
        <BrandMark className="brand-mark--header" />
      </a>

      <nav
        className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label="Navegación principal"
      >
        <a href="#metodo" onClick={closeMenu}>
          Método
        </a>
        <a href="#espacio" onClick={closeMenu}>
          Espacio
        </a>
        <a href="#planes" onClick={closeMenu}>
          Planes
        </a>
        <a href="#contacto" onClick={closeMenu}>
          Contacto
        </a>
        <div className="site-nav__mobile-cta">
          <a
            className="header-instagram header-instagram--mobile"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de Plaza Fitness"
          >
            <Instagram size={17} />
          </a>
          <WhatsAppButton compact />
        </div>
      </nav>

      <div className="site-header__actions">
        <a className="header-phone" href="tel:+56952254029">
          <Phone size={15} /> <span>9 5225 4029</span>
        </a>
        <a
          className="header-instagram"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram de Plaza Fitness"
        >
          <Instagram size={16} />
        </a>
        <WhatsAppButton compact />
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </motion.header>
  );
}
