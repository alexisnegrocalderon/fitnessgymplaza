import { useEffect, useRef, useState } from "react";
import { Instagram, Menu, Phone, X } from "lucide-react";
import { BrandMark, WhatsAppButton } from "@/components/common";
import { INSTAGRAM_URL } from "@/lib/gym-content";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 48);
        ticking.current = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <a href="#inicio" className="brand-lockup" aria-label="Plaza Fitness, volver al inicio">
        <BrandMark className="brand-mark--header" />
      </a>

      <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navegación principal">
        <a href="#metodo" onClick={closeMenu}>Método</a>
        <a href="#espacio" onClick={closeMenu}>Espacio</a>
        <a href="#planes" onClick={closeMenu}>Planes</a>
        <a href="#contacto" onClick={closeMenu}>Contacto</a>
        <div className="site-nav__mobile-cta">
          <a className="header-instagram header-instagram--mobile" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram de Plaza Fitness">
            <Instagram size={17} />
          </a>
          <WhatsAppButton compact />
        </div>
      </nav>

      <div className="site-header__actions">
        <a className="header-phone" href="tel:+56952254029">
          <Phone size={15} /> <span>9 5225 4029</span>
        </a>
        <a className="header-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram de Plaza Fitness">
          <Instagram size={16} />
        </a>
        <WhatsAppButton compact />
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
