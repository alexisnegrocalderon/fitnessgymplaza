import { ArrowUpRight, MessageCircle } from "lucide-react";
import { MARK_URL, WHATSAPP_URL } from "@/lib/gym-content";

export function BrandMark({ className = "", decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <img
      src={MARK_URL}
      alt={decorative ? "" : "Plaza Fitness"}
      aria-hidden={decorative ? true : undefined}
      className={`brand-mark ${className}`}
    />
  );
}

export function SectionTag({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <div className={`section-tag ${light ? "section-tag--light" : ""}`}>
      <span className="section-tag__line" />
      <span>{children}</span>
    </div>
  );
}

export function WhatsAppButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      className={`button button--cobalt magnetic ${compact ? "button--compact" : ""}`}
      data-cursor="pill"
    >
      <MessageCircle size={compact ? 16 : 18} strokeWidth={2.2} />
      <span>Conversemos</span>
      <ArrowUpRight size={16} />
    </a>
  );
}
