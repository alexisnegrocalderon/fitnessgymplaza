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

const BASE_WHATSAPP = "https://wa.me/56952254029";

export function buildWhatsappLink(message: string) {
  return `${BASE_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_URL = buildWhatsappLink(
  "Hola Plaza Fitness, quiero conocer los planes y horarios."
);
export const INSTAGRAM_URL = "https://www.instagram.com/plazafitnessvina";

export const ADDRESS_LINE = "Calle Quillota 656";
export const ADDRESS_CITY = "Viña del Mar";

export type Audience = "general" | "student";

export type Plan = {
  id: string;
  audience: Audience;
  label: string;
  price: string;
  tagline: string;
  note: string;
  cadence: string;
  featured?: boolean;
  studentRequirement?: boolean;
};

export const plans: Plan[] = [
  {
    id: "general-single",
    audience: "general",
    label: "Clase única",
    price: "$8.000",
    tagline: "Conoce el circuito",
    note: "Una sesión para probar el ritmo, la guía técnica y el formato de Plaza Fitness.",
    cadence: "Ideal para una primera experiencia.",
  },
  {
    id: "general-8",
    audience: "general",
    label: "Base 8",
    price: "$45.000",
    tagline: "Construye constancia",
    note: "Un formato pensado para convertir el entrenamiento en una práctica semanal sostenible.",
    cadence: "Frecuencia sugerida: 2 veces por semana.",
  },
  {
    id: "general-12",
    audience: "general",
    label: "Progresión 12",
    price: "$60.000",
    tagline: "Más pulso, más progreso",
    note: "Mayor presencia en la semana para profundizar técnica, capacidad y consistencia.",
    cadence: "Frecuencia sugerida: 3 veces por semana.",
    featured: true,
  },
  {
    id: "student-single",
    audience: "student",
    label: "Clase única",
    price: "$6.000",
    tagline: "Acceso estudiante",
    note: "Una sesión con tarifa estudiante para conocer la dinámica del gimnasio.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
  {
    id: "student-8",
    audience: "student",
    label: "Base 8",
    price: "$36.000",
    tagline: "Ritmo estudiante",
    note: "Una alternativa diseñada para sostener movimiento, estudio y bienestar en paralelo.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
  {
    id: "student-12",
    audience: "student",
    label: "Progresión 12",
    price: "$46.000",
    tagline: "Sostén el hábito",
    note: "Más presencia para acompañar tu condición física durante el semestre.",
    cadence: "Requiere certificado de alumno regular.",
    studentRequirement: true,
  },
];

export const method = [
  {
    id: "01",
    title: "Profesores en cada estación",
    text: "Acompañamiento presente para enseñar cada ejercicio y mantener la intención de la sesión.",
  },
  {
    id: "02",
    title: "Técnica y postura",
    text: "Correcciones oportunas para moverte con mayor seguridad, control y conciencia corporal.",
  },
  {
    id: "03",
    title: "Nivel adaptado a ti",
    text: "Cada estímulo se ajusta a tus capacidades, experiencia y condición actual.",
  },
  {
    id: "04",
    title: "Entrenamiento global",
    text: "Trabajamos grupos musculares de forma integrada, no aislada, para un cuerpo más funcional.",
  },
  {
    id: "05",
    title: "Capacidad cardiovascular",
    text: "Desarrollamos resistencia respiratoria y cardiovascular para sostener mejor el esfuerzo diario.",
  },
  {
    id: "06",
    title: "Fuerza y movilidad",
    text: "Potenciamos músculos y articulaciones para ganar movimiento útil, estable y disponible.",
  },
  {
    id: "07",
    title: "Salud activa",
    text: "Una práctica para mejorar o mantener tu condición física y composición corporal a largo plazo.",
  },
];

export const scheduleGroups = [
  {
    id: "lwmf",
    badge: "01",
    nav: "L / M / V",
    title: "Tu semana en marcha",
    days: "Lunes, miércoles y viernes",
    brief:
      "Seis oportunidades para instalar una frecuencia que se siente en tu cuerpo.",
    slots: [
      "08:30–09:30",
      "09:30–10:30",
      "12:00–13:00",
      "17:00–18:00",
      "18:00–19:00",
      "19:00–20:00",
    ],
  },
  {
    id: "tt",
    badge: "02",
    nav: "M / J",
    title: "Tu ritmo intercalado",
    days: "Martes y jueves",
    brief:
      "Una ruta compacta para volver, recuperar y progresar sin desconectarte.",
    slots: [
      "08:30–09:30",
      "09:30–10:30",
      "12:00–13:00",
      "18:00–19:00",
      "19:00–20:00",
      "20:00–21:00",
    ],
  },
  {
    id: "sat",
    badge: "03",
    nav: "SÁB",
    title: "Activa tu sábado",
    days: "Sábado",
    brief: "Dos sesiones para abrir el fin de semana con energía y técnica.",
    slots: ["09:30–10:30", "10:30–11:30"],
  },
];

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
