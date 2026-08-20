import { Instagram, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/common";
import { ADDRESS_LINE, INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/gym-content";

export default function Footer() {
  return (
    <footer className="site-footer section-dark">
      <div className="container site-footer__inner">
        <a
          href="#inicio"
          className="brand-lockup"
          aria-label="Plaza Fitness, volver al inicio"
        >
          <BrandMark className="brand-mark--footer" />
        </a>
        <span className="site-footer__copy">
          © 2026 Plaza Fitness · {ADDRESS_LINE} · Viña del Mar
        </span>
        <div className="site-footer__links">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            <Instagram size={15} /> Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
