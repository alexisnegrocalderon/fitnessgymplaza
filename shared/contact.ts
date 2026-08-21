/** Datos de contacto — compartido entre el cliente y las plantillas de
 * mail del servidor. */
export const SITE_URL = "https://plazafitness.cl";

export const BASE_WHATSAPP = "https://wa.me/56952254029";

export function buildWhatsappLink(message: string) {
  return `${BASE_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_URL = buildWhatsappLink(
  "Hola Plaza Fitness, quiero conocer los planes y horarios."
);
export const INSTAGRAM_URL = "https://www.instagram.com/plazafitnessvina";

export const ADDRESS_LINE = "Calle Quillota 656";
export const ADDRESS_CITY = "Viña del Mar";

export function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
