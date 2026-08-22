import { neon } from "@neondatabase/serverless";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  eventSettings,
  InsertMpConnection,
  InsertPlanPurchase,
  InsertRegistration,
  InsertUser,
  mpConnections,
  planPurchases,
  registrations,
  users,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";
import { EVENT_CAPACITY } from "../shared/registration.js";

export { EVENT_CAPACITY };

let _db: ReturnType<typeof drizzle> | null = null;

/** La integración Neon↔Vercel no siempre publica la cadena de conexión
 * como DATABASE_URL: según cómo se cree el store, llega como POSTGRES_URL
 * o DATABASE_URL_UNPOOLED. Mirar un solo nombre dejaba la app sin base
 * aunque la variable estuviera puesta, así que se aceptan todos. */
const CONNECTION_STRING_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

function resolveConnectionString(): string | undefined {
  for (const key of CONNECTION_STRING_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export function getDb() {
  if (!_db) {
    const connectionString = resolveConnectionString();
    if (connectionString) _db = drizzle(neon(connectionString));
  }
  return _db;
}

/** El "Database not configured" a secas no decía nada accionable. Este
 * nombra las variables que sí llegaron al runtime (solo los nombres,
 * nunca los valores) para que el log diga de una si falta la variable o
 * si viene con otro nombre. */
function databaseNotConfigured(): Error {
  const seen = CONNECTION_STRING_KEYS.filter(key => process.env[key]?.trim());
  return new Error(
    `Database not configured: ninguna cadena de conexión disponible. Variables buscadas: ${CONNECTION_STRING_KEYS.join(", ")}. Presentes: ${seen.length ? seen.join(", ") : "ninguna"}.`
  );
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

// ---------------------------------------------------------------------------
// Inscripciones — Gran Inauguración
// ---------------------------------------------------------------------------

/** pending + approved cuentan contra el cupo; rejected libera el lugar. */
export async function countActiveRegistrations(): Promise<number> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(ne(registrations.status, "rejected"));
  return count;
}

/** La identidad de una inscripción es el email: es a donde llega la
 * invitación. El WhatsApp NO se usa para deduplicar — dos personas de la
 * misma casa comparten teléfono y la segunda quedaba fuera del evento. */
export async function findRegistrationByEmail(email: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(registrations)
    .where(
      and(
        ne(registrations.status, "rejected"),
        eq(registrations.email, email.trim().toLowerCase())
      )
    )
    .limit(1);
  return result[0];
}

/** Al reinscribirse con los mismos datos de contacto, el nombre/WhatsApp
 * más recientes reemplazan a los de la fila original. */
export async function updateRegistrationContact(
  id: number,
  data: Pick<InsertRegistration, "fullName" | "whatsapp">
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(registrations)
    .set({ fullName: data.fullName, whatsapp: data.whatsapp })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

/** Se sella recién cuando Resend aceptó el envío, nunca al aprobar:
 * así el panel distingue "aprobado" de "invitación efectivamente enviada". */
export async function markInvitationSent(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(registrations)
    .set({ invitationSentAt: new Date() })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

export async function createRegistration(data: InsertRegistration) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db.insert(registrations).values(data).returning();
  return row;
}

export async function listRegistrations() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db.select().from(registrations).orderBy(desc(registrations.createdAt));
}

export async function getRegistrationById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);
  return result[0];
}

export async function markRegistrationApproved(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(registrations)
    .set({ status: "approved" })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

export async function markRegistrationRejected(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(registrations)
    .set({ status: "rejected" })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

/** Borrado definitivo de una inscripción — el panel lo protege con doble
 * confirmación (y con la clave del admin si la fila tiene pagos). */
export async function deleteRegistration(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .delete(registrations)
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

export async function createApprovedRegistration(data: InsertRegistration) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .insert(registrations)
    .values({ ...data, status: "approved" })
    .returning();
  return row;
}

/** Sube a "approved" una fila "pending" heredada de cuando /inauguracion
 * todavía cobraba — la inscripción ya no tiene costo, así que no lleva
 * campos de pago. */
export async function approveRegistration(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(registrations)
    .set({ status: "approved" })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Conexión Mercado Pago (OAuth / Marketplace Connect) — fila única.
// ---------------------------------------------------------------------------

export async function getMpConnection() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db.select().from(mpConnections).limit(1);
  return result[0];
}

/** Reemplaza la fila única existente (si la hay) por la conexión nueva. */
export async function saveMpConnection(
  data: Omit<InsertMpConnection, "id" | "connectedAt" | "updatedAt">
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const existing = await getMpConnection();
  if (existing) {
    const [row] = await db
      .update(mpConnections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mpConnections.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db.insert(mpConnections).values(data).returning();
  return row;
}

export async function updateMpConnectionTokens(
  id: number,
  data: Pick<InsertMpConnection, "accessToken" | "refreshToken" | "expiresAt">
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(mpConnections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(mpConnections.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Configuración del evento (cargo por servicio) — fila única.
// ---------------------------------------------------------------------------

/** Crea la fila por defecto la primera vez que se pide (10% = 1000 bps). */
export async function getEventSettings() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const existing = await db.select().from(eventSettings).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(eventSettings).values({}).returning();
  return row;
}

export async function updateServiceChargeBps(bps: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const current = await getEventSettings();
  const [row] = await db
    .update(eventSettings)
    .set({ serviceChargeBps: bps, updatedAt: new Date() })
    .where(eq(eventSettings.id, current.id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Compra de planes de gimnasio — /planes
// ---------------------------------------------------------------------------

export async function findPlanPurchaseByContact(
  email: string,
  whatsapp: string
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(planPurchases)
    .where(
      and(
        ne(planPurchases.status, "rejected"),
        eq(planPurchases.email, email.toLowerCase())
      )
    )
    .limit(1);
  if (result[0]) return result[0];

  const byWhatsapp = await db
    .select()
    .from(planPurchases)
    .where(
      and(
        ne(planPurchases.status, "rejected"),
        eq(planPurchases.whatsapp, whatsapp)
      )
    )
    .limit(1);
  return byWhatsapp[0];
}

export async function createPlanPurchase(data: InsertPlanPurchase) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db.insert(planPurchases).values(data).returning();
  return row;
}

export async function createApprovedPlanPurchase(data: InsertPlanPurchase) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .insert(planPurchases)
    .values({ ...data, status: "approved" })
    .returning();
  return row;
}

export async function markPlanPurchaseApprovedWithPayment(
  id: number,
  mpPaymentId: string,
  amount: number
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(planPurchases)
    .set({ status: "approved", mpPaymentId, amount })
    .where(eq(planPurchases.id, id))
    .returning();
  return row;
}

export async function getPlanPurchaseById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(planPurchases)
    .where(eq(planPurchases.id, id))
    .limit(1);
  return result[0];
}

/** Igual que deleteRegistration, pero una compra siempre lleva dinero
 * asociado, así que el panel siempre pide la clave del admin. */
export async function deletePlanPurchase(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .delete(planPurchases)
    .where(eq(planPurchases.id, id))
    .returning();
  return row;
}

export async function listPlanPurchases() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db.select().from(planPurchases).orderBy(desc(planPurchases.createdAt));
}
