import { neon } from "@neondatabase/serverless";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  InsertRegistration,
  InsertUser,
  registrations,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(neon(process.env.DATABASE_URL));
  }
  return _db;
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

/** Cupos internos. Nunca se muestra al público, solo cierra el formulario. */
export const EVENT_CAPACITY = 100;

/** pending + approved cuentan contra el cupo; rejected libera el lugar. */
export async function countActiveRegistrations(): Promise<number> {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(ne(registrations.status, "rejected"));
  return count;
}

export async function findRegistrationByContact(
  email: string,
  whatsapp: string
) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const result = await db
    .select()
    .from(registrations)
    .where(
      and(
        ne(registrations.status, "rejected"),
        eq(registrations.email, email.toLowerCase())
      )
    )
    .limit(1);
  if (result[0]) return result[0];

  const byWhatsapp = await db
    .select()
    .from(registrations)
    .where(
      and(
        ne(registrations.status, "rejected"),
        eq(registrations.whatsapp, whatsapp)
      )
    )
    .limit(1);
  return byWhatsapp[0];
}

export async function createRegistration(data: InsertRegistration) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const [row] = await db.insert(registrations).values(data).returning();
  return row;
}

export async function listRegistrations() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db.select().from(registrations).orderBy(desc(registrations.createdAt));
}

export async function getRegistrationById(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);
  return result[0];
}

export async function markRegistrationApproved(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const [row] = await db
    .update(registrations)
    .set({ status: "approved", invitationSentAt: new Date() })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}

export async function markRegistrationRejected(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const [row] = await db
    .update(registrations)
    .set({ status: "rejected" })
    .where(eq(registrations.id, id))
    .returning();
  return row;
}
