import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
