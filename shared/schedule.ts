/** Horarios de clases — compartido entre el cliente (sección Horarios) y
 * el servidor (bloque de horarios en los mails de confirmación). */
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
