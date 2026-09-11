import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);

/**
 * Core user table backing the (unused) Manus OAuth flow in server/_core.
 * Kept as-is, not wired into the app — only the dialect was fixed from
 * MySQL to Postgres so `drizzle-kit` can target the same Neon database as
 * the tables actually in use below.
 */
export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const registrationStatus = pgEnum("registration_status", [
  "pending",
  "approved",
  "rejected",
]);

/**
 * Inscripciones a la Gran Inauguración (29 de agosto). Cupo interno de 100
 * personas — ver EVENT_CAPACITY en server/registrations.ts. El número nunca
 * se muestra públicamente, solo se usa para cerrar el formulario.
 */
export const registrations = pgTable("registrations", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  status: registrationStatus("status").default("pending").notNull(),
  invitationSentAt: timestamp("invitationSentAt"),
  mpPaymentId: varchar("mpPaymentId", { length: 64 }),
  amount: integer("amount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/**
 * Conexión OAuth del dueño con su cuenta de Mercado Pago (Marketplace
 * Connect) — fila única. Los pagos de /inauguracion se crean con el
 * accessToken de aquí, así que acreditan directo en la cuenta del dueño.
 */
export const mpConnections = pgTable("mp_connections", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  mpUserId: varchar("mpUserId", { length: 64 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  publicKey: varchar("publicKey", { length: 128 }).notNull(),
  liveMode: boolean("liveMode").default(true).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MpConnection = typeof mpConnections.$inferSelect;
export type InsertMpConnection = typeof mpConnections.$inferInsert;

/**
 * Configuración general del gimnasio — fila única. Nació como configuración
 * del evento de inauguración (de ahí el nombre de tabla `event_settings`,
 * que se mantiene para no arriesgar una migración de renombre sobre datos
 * reales en producción) y ahora también guarda las reglas operativas de
 * clases y reservas, editables desde /admin sin necesidad de deploy.
 *
 * `serviceChargeBps` es el cargo por servicio en puntos base (1000 =
 * 10.00%) que se suma al valor del plan al pagar online; se guarda en
 * enteros para evitar errores de redondeo con decimales.
 *
 * `mpFeeRateBps` es la tasa de comisión de Mercado Pago asumida para
 * calcular ese cargo con la fórmula de "gross-up" (ver shared/registration.ts)
 * — no hay un valor real medido todavía porque los cobros de Plaza Fitness
 * han sido presenciales hasta ahora, así que arranca en la tasa estándar
 * publicada por Mercado Pago Chile y se recalibra con datos reales una vez
 * que empiecen a entrar pagos online.
 */
export const eventSettings = pgTable("event_settings", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  serviceChargeBps: integer("serviceChargeBps").default(1000).notNull(),
  mpFeeRateBps: integer("mpFeeRateBps").default(350).notNull(),
  defaultCapacity: integer("defaultCapacity").default(20).notNull(),
  bookingOpenDays: integer("bookingOpenDays").default(30).notNull(),
  bookingCloseMinutes: integer("bookingCloseMinutes").default(30).notNull(),
  cancelWindowHours: integer("cancelWindowHours").default(2).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EventSettings = typeof eventSettings.$inferSelect;
export type InsertEventSettings = typeof eventSettings.$inferInsert;

export const planAudience = pgEnum("plan_audience", ["general", "student"]);
export const planTier = pgEnum("plan_tier", [
  "single",
  "eight",
  "twelve",
  "pack3",
  "pack6",
]);

/**
 * Compra de un plan de gimnasio desde /planes. Reutiliza el enum
 * `registrationStatus` (pending/approved/rejected): nace "pending" al
 * completar los datos de contacto, y sube a "approved" solo cuando el
 * pago de Mercado Pago se confirma — mismo patrón que `registrations`.
 */
export const planPurchases = pgTable("plan_purchases", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  rut: varchar("rut", { length: 16 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  audience: planAudience("audience").notNull(),
  tier: planTier("tier").notNull(),
  planLabel: varchar("planLabel", { length: 60 }).notNull(),
  status: registrationStatus("status").default("pending").notNull(),
  mpPaymentId: varchar("mpPaymentId", { length: 64 }),
  amount: integer("amount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Enlaza la compra con la identidad del alumno (tabla `members`, más
  // abajo). Nullable: las compras hechas antes de que existiera la cuenta
  // de alumno se enlazan de forma perezosa — ver ensureMemberForEmail en
  // server/db.ts, que las vincula por email la primera vez que ese correo
  // pide un magic link o vuelve a comprar.
  memberId: integer("memberId").references((): AnyPgColumn => members.id),
});

export type PlanPurchase = typeof planPurchases.$inferSelect;
export type InsertPlanPurchase = typeof planPurchases.$inferInsert;

// ---------------------------------------------------------------------------
// Cuenta de alumno, créditos y reserva de cupos (Fase 1)
// ---------------------------------------------------------------------------

/**
 * El alumno. Es la identidad que hasta ahora no existía — antes se compraba
 * como invitado (nombre + email + whatsapp sueltos en cada fila de
 * `plan_purchases`). Se identifica por email, sin contraseña: el acceso es
 * por magic link (ver `auth_tokens`).
 */
export const memberStatus = pgEnum("member_status", ["active", "inactive"]);
export const studentCertificateStatus = pgEnum("student_certificate_status", [
  "not_applicable",
  "pending_verification",
  "verified",
]);

export const members = pgTable("members", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  rut: varchar("rut", { length: 16 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  audience: planAudience("audience").default("general").notNull(),
  status: memberStatus("status").default("active").notNull(),
  // Se marca "pending_verification" cuando el alumno elige precio
  // estudiante online; el equipo lo pasa a "verified" en /admin al revisar
  // el certificado en persona. No bloquea el pago — es solo una alerta
  // operativa para la puerta, ver §2 del plan.
  studentCertificateStatus: studentCertificateStatus("studentCertificateStatus")
    .default("not_applicable")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/** Magic links de un solo uso para entrar a /app. Se guarda el hash del
 * token, nunca el token en claro — igual criterio que una contraseña. */
export const authTokens = pgTable("auth_tokens", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  memberId: integer("memberId")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

/**
 * Un plan comprado y activo. Aquí vive el saldo de créditos y su
 * vencimiento — ver shared/credits.ts para cuántos créditos y cada cuántos
 * días recarga cada tier. `renewalsRemaining` es para los packs de 3/6
 * meses: cuántas recargas mensuales automáticas le quedan además de la
 * entregada al comprar.
 */
export const membershipStatus = pgEnum("membership_status", [
  "active",
  "expired",
  "cancelled",
]);

export const memberships = pgTable("memberships", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  memberId: integer("memberId")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  purchaseId: integer("purchaseId").references(
    (): AnyPgColumn => planPurchases.id
  ),
  tier: planTier("tier").notNull(),
  creditsTotal: integer("creditsTotal").notNull(),
  creditsUsed: integer("creditsUsed").default(0).notNull(),
  renewalsRemaining: integer("renewalsRemaining").default(0).notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  status: membershipStatus("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

/** Historial de movimientos de crédito — append-only, nunca se edita un
 * saldo directamente. Así siempre se puede auditar por qué a alguien le
 * faltan clases. */
export const creditLedgerReason = pgEnum("credit_ledger_reason", [
  "purchase",
  "booking",
  "cancel",
  "no_show",
  "admin_adjust",
  "expired",
]);

export const creditLedger = pgTable("credit_ledger", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  membershipId: integer("membershipId")
    .notNull()
    .references(() => memberships.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: creditLedgerReason("reason").notNull(),
  // Enlace informativo a la reserva que originó el movimiento — sin FK
  // estricta: el ledger no debe perder su historial si algún día se poda
  // la tabla de reservas.
  bookingId: integer("bookingId"),
  note: varchar("note", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type InsertCreditLedgerEntry = typeof creditLedger.$inferInsert;

/** Los profesores en sala. */
export const coaches = pgTable("coaches", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  active: boolean("active").default(true).notNull(),
});

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

/** Los bloques recurrentes de horario (ej. "lunes 08:30–09:30") — lo que
 * hoy está hardcodeado en shared/schedule.ts pasa a vivir acá, editable
 * desde /admin. `weekday`: 0=domingo … 6=sábado (convención JS Date). */
export const classTemplates = pgTable("class_templates", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  weekday: integer("weekday").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  capacity: integer("capacity").notNull(),
  coachId: integer("coachId").references(() => coaches.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassTemplate = typeof classTemplates.$inferSelect;
export type InsertClassTemplate = typeof classTemplates.$inferInsert;

/** La instancia concreta de una clase en una fecha — es sobre esto que se
 * reserva. `date` guarda el día calendario en Chile ("YYYY-MM-DD", sin
 * hora) para que las reglas de ventana (shared/booking.ts) no dependan de
 * ambigüedades de huso horario; `startsAt`/`endsAt` son el instante UTC
 * real, para comparar contra "ahora". */
export const classSessionStatus = pgEnum("class_session_status", [
  "scheduled",
  "cancelled",
]);

export const classSessions = pgTable("class_sessions", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  templateId: integer("templateId").references(() => classTemplates.id),
  date: varchar("date", { length: 10 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  capacity: integer("capacity").notNull(),
  bookedCount: integer("bookedCount").default(0).notNull(),
  coachId: integer("coachId").references(() => coaches.id),
  status: classSessionStatus("status").default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassSession = typeof classSessions.$inferSelect;
export type InsertClassSession = typeof classSessions.$inferInsert;

/** La reserva de un alumno a una sesión. `sessionDate` duplica la fecha de
 * la sesión (denormalizado a propósito) para poder aplicar la regla de "1
 * clase por día" con un índice único parcial de base de datos — la validación
 * real vive acá, no solo en la UI. */
export const bookingStatus = pgEnum("booking_status", [
  "booked",
  "waitlisted",
  "cancelled",
  "attended",
  "no_show",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    sessionId: integer("sessionId")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    memberId: integer("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    membershipId: integer("membershipId").references(() => memberships.id),
    sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
    status: bookingStatus("status").default("booked").notNull(),
    position: integer("position"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    cancelledAt: timestamp("cancelledAt"),
  },
  table => ({
    // Un alumno no puede tener dos reservas activas (booked o waitlisted)
    // el mismo día — se aplica en la base de datos, no solo en el cliente.
    oneActiveBookingPerDay: uniqueIndex("bookings_one_active_per_day")
      .on(table.memberId, table.sessionDate)
      .where(sql`${table.status} in ('booked','waitlisted')`),
  })
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/** Fechas puntuales bloqueadas por el admin (feriados, vacaciones). Las
 * sesiones generadas para estas fechas se saltan o se cancelan. */
export const closedDates = pgTable("closed_dates", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),
  reason: varchar("reason", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClosedDate = typeof closedDates.$inferSelect;
export type InsertClosedDate = typeof closedDates.$inferInsert;
