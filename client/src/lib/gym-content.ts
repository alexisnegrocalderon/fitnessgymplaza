// Los videos viven en client/public/media en todos lados excepto dentro del
// propio entorno de desarrollo de Manus, donde se sirven vía su proxy
// /manus-storage/. Detectar "es Manus dev" (no "es Vercel") es lo correcto:
// cualquier otro host —Vercel, un dominio propio como plazafitness.cl, etc.—
// debe usar /media/. La lista de hosts es la misma que vite.config.ts permite
// para el server de desarrollo.
const MANUS_DEV_HOSTS = [
  ".manuspre.computer",
  ".manus.computer",
  ".manus-asia.computer",
  ".manuscomputer.ai",
  ".manusvm.computer",
];
const isManusDevRuntime =
  typeof window !== "undefined" &&
  MANUS_DEV_HOSTS.some(host => window.location.hostname.endsWith(host));

export const VIDEO_URL = isManusDevRuntime
  ? "/manus-storage/plaza-fitness-hero-desktop_deedf91e.mp4"
  : "/media/plaza-fitness-hero-desktop.mp4";
export const MOBILE_VIDEO_URL = isManusDevRuntime
  ? "/manus-storage/plaza-fitness-hero-mobile-3x4_e0a54070.mp4"
  : "/media/plaza-fitness-hero-mobile-3x4.mp4";
export const MARK_URL = "/media/plaza-fitness-logo.png";
export const SPACE_IMAGE = "/media/plaza-fitness-space.jpg";
export const COACHING_IMAGE = "/media/plaza-fitness-coaching.jpg";
export const GRIP_IMAGE = "/media/plaza-fitness-plans-accent.jpg";
export const STOREFRONT_IMAGE = "/media/plaza-fitness-storefront.jpg";

export {
  plans,
  findPlan,
  planPriceToNumber,
  type Audience,
  type Plan,
  type PlanTier,
} from "@shared/plans";

export {
  BASE_WHATSAPP,
  buildWhatsappLink,
  WHATSAPP_URL,
  INSTAGRAM_URL,
  ADDRESS_LINE,
  ADDRESS_CITY,
  mapsSearchUrl,
} from "@shared/contact";

export { scheduleGroups } from "@shared/schedule";

export { method } from "@shared/method";

export const policies = [
  {
    metric: "30 días",
    title: "Planifica con tiempo",
    text: "Puedes organizar tus clases con hasta 30 días de anticipación.",
  },
  {
    metric: "30 min",
    title: "Cierre de reserva",
    text: "La inscripción para una clase permanece disponible hasta 30 minutos antes de comenzar.",
  },
  {
    metric: "2 horas",
    title: "Cuida tu crédito",
    text: "Cancela con dos horas de anticipación para no perder el crédito de tu clase.",
  },
  {
    metric: "Jueves 22:30",
    title: "Cupos de sábado",
    text: "A las 22:30 del jueves se activan los cupos de las clases del sábado: el momento perfecto para organizar tu entrenamiento del fin de semana.",
  },
  {
    metric: "Sábados",
    title: "Sesiones especiales",
    text: "Consulta directamente con el equipo la programación vigente para los sábados.",
  },
  {
    metric: "Certificado",
    title: "Pausa tu plan",
    text: "Si necesitas una pausa, el equipo evalúa tu solicitud con certificado médico.",
  },
];

export const transferData: Array<[label: string, value: string]> = [
  ["Titular", "Deportes Plaza Fitness Limitada"],
  ["RUT", "77.603.706-0"],
  ["Banco", "Banco de Chile"],
  ["Tipo", "Cuenta Corriente"],
  ["Cuenta", "00-535-05830-06"],
  ["Comprobante", "plazafitnesschile@gmail.com"],
];
