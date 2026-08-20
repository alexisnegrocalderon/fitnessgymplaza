import { Clock3, MapPin, Phone } from "lucide-react";
import { BrandMark, SectionTag, WhatsAppButton } from "@/components/common";
import { Reveal } from "@/components/Reveal";
import { ADDRESS_LINE, STOREFRONT_IMAGE } from "@/lib/gym-content";

export default function Contact() {
  return (
    <section id="contacto" className="contact-section section-bone">
      <div className="contact-section__mark" aria-hidden="true">
        <BrandMark className="brand-mark--contact" decorative />
      </div>
      <div className="section-meter" aria-hidden="true">
        <span>07 / 07</span>
        <i />
        <span>Contact / Viña del Mar</span>
      </div>
      <div className="container contact-layout">
        <div className="contact-layout__main">
          <Reveal>
            <SectionTag>Da el siguiente paso</SectionTag>
          </Reveal>
          <Reveal kind="mask" delay={0.06}>
            <h2>
              Nos vemos
              <br />
              <em>en la pista.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p>
              Escríbenos y conversemos sobre tu objetivo, tu experiencia y el
              formato que mejor calza contigo.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <WhatsAppButton />
          </Reveal>
        </div>
        <Reveal delay={0.1} className="contact-layout__details">
          <div className="image-frame contact-storefront">
            <img
              src={STOREFRONT_IMAGE}
              alt="Fachada de Plaza Fitness en Viña del Mar"
              loading="lazy"
            />
          </div>
          <div className="contact-details-rows">
            <div className="contact-detail">
              <MapPin size={20} />
              <div>
                <span>Encuéntranos</span>
                <strong>
                  {ADDRESS_LINE}
                  <br />
                  Viña del Mar, Valparaíso
                </strong>
              </div>
            </div>
            <div className="contact-detail">
              <Clock3 size={20} />
              <div>
                <span>Horarios</span>
                <strong>
                  Consulta disponibilidad
                  <br />
                  por WhatsApp
                </strong>
              </div>
            </div>
            <div className="contact-detail">
              <Phone size={20} />
              <div>
                <span>WhatsApp</span>
                <strong>+56 9 5225 4029</strong>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="contact-section__marquee" aria-hidden="true">
        <span>Plaza Fitness · {ADDRESS_LINE} · Viña del Mar · </span>
        <span>Plaza Fitness · {ADDRESS_LINE} · Viña del Mar · </span>
      </div>
    </section>
  );
}
