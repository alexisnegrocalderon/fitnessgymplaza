import { randomBytes, createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { and, asc, desc, eq, gt, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  authTokens,
  bookings,
  classSessions,
  classTemplates,
  closedDates,
  coaches,
  creditLedger,
  eventSettings,
  InsertAuthToken,
  InsertBooking,
  InsertClassSession,
  InsertClassTemplate,
  InsertClosedDate,
  InsertCoach,
  InsertCreditLedgerEntry,
  InsertMember,
  InsertMembership,
  InsertMpConnection,
  InsertPlanPurchase,
  InsertRegistration,
  InsertUser,
  members,
  memberships,
  mpConnections,
  planPurchases,
  registrations,
  users,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";
import { EVENT_CAPACITY } from "../shared/registration.js";
import {
  creditsForTier,
  membershipExpiryFrom,
  renewalsForTier,
} from "../shared/credits.js";
import type { Audience, PlanTier } from "../shared/plans.js";

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

/** Actualiza cualquier subconjunto de las reglas operativas del gimnasio
 * (aforo por defecto, ventanas de reserva/cancelación, tasa de MP asumida
 * para el cargo por servicio) — ver comentario de `eventSettings` en el
 * schema para el detalle de cada campo. */
export async function updateGymSettings(
  patch: Partial<{
    defaultCapacity: number;
    bookingOpenDays: number;
    bookingCloseMinutes: number;
    cancelWindowHours: number;
    mpFeeRateBps: number;
  }>
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const current = await getEventSettings();
  const [row] = await db
    .update(eventSettings)
    .set({ ...patch, updatedAt: new Date() })
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

/** Busca por `mpPaymentId` — usada por el webhook para no procesar dos
 * veces la misma notificación (Mercado Pago puede reenviarla). */
export async function getPlanPurchaseByMpPaymentId(mpPaymentId: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(planPurchases)
    .where(eq(planPurchases.mpPaymentId, mpPaymentId))
    .limit(1);
  return result[0];
}

/** La compra "pending" más reciente de un email — es a esta a la que el
 * webhook sube el estado cuando Mercado Pago confirma el pago después de
 * la respuesta síncrona (ej. pago en efectivo o que demora en acreditar). */
export async function findPendingPlanPurchaseByEmail(email: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(planPurchases)
    .where(
      and(
        eq(planPurchases.status, "pending"),
        eq(planPurchases.email, email.toLowerCase())
      )
    )
    .orderBy(desc(planPurchases.createdAt))
    .limit(1);
  return result[0];
}

export async function markPlanPurchaseRejected(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(planPurchases)
    .set({ status: "rejected" })
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

// ---------------------------------------------------------------------------
// Alumnos (members) y magic link — Fase 1
// ---------------------------------------------------------------------------

/** Busca o crea un alumno por email. Si es la primera vez que este email
 * aparece, también lo enlaza retroactivamente con cualquier compra previa
 * (`plan_purchases`) hecha con ese mismo correo cuando todavía se compraba
 * como invitado — así no hace falta una migración de datos aparte. */
export async function ensureMemberForEmail(
  email: string,
  defaults: {
    fullName: string;
    whatsapp?: string;
    rut?: string;
    audience?: Audience;
  }
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select()
    .from(members)
    .where(eq(members.email, normalizedEmail))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(members)
    .values({
      email: normalizedEmail,
      fullName: defaults.fullName,
      whatsapp: defaults.whatsapp,
      rut: defaults.rut,
      audience: defaults.audience ?? "general",
    })
    .returning();

  // Enlace retroactivo: cualquier compra anterior con este email que
  // todavía no tuviera memberId (comprada como invitado) pasa a apuntar a
  // esta identidad recién creada.
  await db
    .update(planPurchases)
    .set({ memberId: created.id })
    .where(
      and(
        eq(planPurchases.email, normalizedEmail),
        sql`${planPurchases.memberId} is null`
      )
    );

  return created;
}

export async function getMemberByEmail(email: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(members)
    .where(eq(members.email, email.trim().toLowerCase()))
    .limit(1);
  return result[0];
}

export async function getMemberById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(members)
    .where(eq(members.id, id))
    .limit(1);
  return result[0];
}

export async function touchMemberLastSeen(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  await db
    .update(members)
    .set({ lastSeenAt: new Date() })
    .where(eq(members.id, id));
}

export async function setMemberCertificateStatus(
  id: number,
  status: "not_applicable" | "pending_verification" | "verified"
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(members)
    .set({ studentCertificateStatus: status })
    .where(eq(members.id, id))
    .returning();
  return row;
}

export async function listMembers() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db.select().from(members).orderBy(desc(members.createdAt));
}

const AUTH_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Genera un magic link de un solo uso para este alumno. Devuelve el token
 * EN CLARO (única vez que existe fuera de la base de datos) — se guarda
 * solo su hash, igual criterio que una contraseña. */
export async function createAuthTokenForMember(
  memberId: number
): Promise<string> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const rawToken = randomBytes(32).toString("hex");
  await db.insert(authTokens).values({
    memberId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL_MS),
  });
  return rawToken;
}

/** Consume un magic link: si es válido, no vencido y no usado, lo marca
 * usado (en el mismo UPDATE, para que dos clics simultáneos no lo canjeen
 * dos veces) y devuelve el memberId. Si no, devuelve undefined. */
export async function consumeAuthToken(
  rawToken: string
): Promise<number | undefined> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        sql`${authTokens.usedAt} is null`,
        gt(authTokens.expiresAt, new Date())
      )
    )
    .returning();
  return row?.memberId;
}

// ---------------------------------------------------------------------------
// Membresías y créditos — Fase 1
// ---------------------------------------------------------------------------

/** Crea la membresía (y su primer movimiento de crédito) a partir de una
 * compra de plan recién aprobada — se llama desde api/plan-pay.ts y desde
 * el webhook de Mercado Pago, los dos únicos lugares donde una compra pasa
 * a "approved". Para los packs de 3/6 meses, `renewalsRemaining` guarda
 * cuántas recargas mensuales automáticas le quedan además de esta. */
export async function createMembershipFromApprovedPurchase(purchase: {
  id: number;
  email: string;
  fullName: string;
  whatsapp: string;
  rut: string;
  audience: Audience;
  tier: PlanTier;
}) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();

  const member = await ensureMemberForEmail(purchase.email, {
    fullName: purchase.fullName,
    whatsapp: purchase.whatsapp,
    rut: purchase.rut,
    audience: purchase.audience,
  });

  if (member.audience !== purchase.audience) {
    await db
      .update(members)
      .set({ audience: purchase.audience })
      .where(eq(members.id, member.id));
  }
  if (
    purchase.audience === "student" &&
    member.studentCertificateStatus === "not_applicable"
  ) {
    await setMemberCertificateStatus(member.id, "pending_verification");
  }

  const startsAt = new Date();
  const creditsTotal = creditsForTier(purchase.tier);
  const [membership] = await db
    .insert(memberships)
    .values({
      memberId: member.id,
      purchaseId: purchase.id,
      tier: purchase.tier,
      creditsTotal,
      renewalsRemaining: renewalsForTier(purchase.tier),
      startsAt,
      expiresAt: membershipExpiryFrom(startsAt),
    })
    .returning();

  await db.insert(creditLedger).values({
    membershipId: membership.id,
    delta: creditsTotal,
    reason: "purchase",
  });

  await db
    .update(planPurchases)
    .set({ memberId: member.id })
    .where(eq(planPurchases.id, purchase.id));

  return membership;
}

/** La membresía de la que se debe descontar el próximo crédito: entre las
 * activas y no vencidas con saldo disponible, la que vence primero — así
 * un alumno con dos membresías vigentes (ej. renovó antes de que terminara
 * la anterior) gasta primero la que está por vencer, en vez de perderla. */
export async function getMembershipToConsumeFor(memberId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.memberId, memberId),
        eq(memberships.status, "active"),
        gt(memberships.expiresAt, new Date()),
        sql`${memberships.creditsUsed} < ${memberships.creditsTotal}`
      )
    )
    .orderBy(asc(memberships.expiresAt))
    .limit(1);
  return result[0];
}

/** Resumen para la pantalla "mi plan": la membresía vigente (o undefined si
 * no tiene ninguna con saldo) y cuántos créditos le quedan. */
export async function getMemberPlanSummary(memberId: number) {
  const membership = await getMembershipToConsumeFor(memberId);
  if (!membership) return undefined;
  return {
    membership,
    creditsRemaining: membership.creditsTotal - membership.creditsUsed,
  };
}

/** Descuenta 1 crédito de forma atómica — el WHERE en el mismo UPDATE es lo
 * que evita que dos reservas simultáneas gasten el mismo último crédito
 * (el driver neon-http no soporta transacciones, así que la atomicidad
 * tiene que vivir en un único UPDATE condicional). Devuelve la fila
 * actualizada si había saldo, o undefined si no. */
async function consumeCreditAtomic(membershipId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(memberships)
    .set({ creditsUsed: sql`${memberships.creditsUsed} + 1` })
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.status, "active"),
        gt(memberships.expiresAt, new Date()),
        sql`${memberships.creditsUsed} < ${memberships.creditsTotal}`
      )
    )
    .returning();
  return row;
}

/** Devuelve 1 crédito (cancelación a tiempo). No hace falta condición en el
 * WHERE más allá del id: nunca baja de 0 gracias al GREATEST. */
async function refundCreditAtomic(membershipId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(memberships)
    .set({ creditsUsed: sql`GREATEST(${memberships.creditsUsed} - 1, 0)` })
    .where(eq(memberships.id, membershipId))
    .returning();
  return row;
}

async function logCreditMovement(entry: InsertCreditLedgerEntry) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  await db.insert(creditLedger).values(entry);
}

/** Ajuste manual desde /admin — nunca se toca `creditsUsed` directamente
 * (eso es historial real de consumo); se ajusta `creditsTotal` hacia
 * arriba o abajo, con motivo obligatorio, y queda en el ledger. Nunca deja
 * `creditsTotal` por debajo de lo ya consumido. */
export async function adminAdjustCredits(
  membershipId: number,
  delta: number,
  note: string
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(memberships)
    .set({
      creditsTotal: sql`GREATEST(${memberships.creditsTotal} + ${delta}, ${memberships.creditsUsed})`,
    })
    .where(eq(memberships.id, membershipId))
    .returning();
  if (row) {
    await logCreditMovement({
      membershipId,
      delta,
      reason: "admin_adjust",
      note,
    });
  }
  return row;
}

/** Ajuste manual de vencimiento (pausa por certificado médico, caso a
 * caso) — sin regla automática de "días de pausa", el admin decide la
 * nueva fecha y deja el motivo registrado en el mismo ledger de créditos
 * (delta 0: no cambia el saldo, solo queda la trazabilidad). */
export async function adminSetMembershipExpiry(
  membershipId: number,
  newExpiresAt: Date,
  note: string
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(memberships)
    .set({ expiresAt: newExpiresAt })
    .where(eq(memberships.id, membershipId))
    .returning();
  if (row) {
    await logCreditMovement({
      membershipId,
      delta: 0,
      reason: "admin_adjust",
      note,
    });
  }
  return row;
}

export async function getMembershipById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, id))
    .limit(1);
  return result[0];
}

export async function listMembershipsForMember(memberId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select()
    .from(memberships)
    .where(eq(memberships.memberId, memberId))
    .orderBy(desc(memberships.createdAt));
}

export async function listCreditLedgerForMembership(membershipId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.membershipId, membershipId))
    .orderBy(desc(creditLedger.createdAt));
}

/**
 * Mantenimiento diario de membresías (pensado para correr desde
 * api/cron/expire-credits.ts una vez al día):
 *
 * - Las que vencieron y no tienen recargas pendientes pasan a "expired";
 *   si les quedaba saldo sin usar, se dejan un movimiento "expired" en el
 *   ledger para que el historial explique el saldo perdido.
 * - Las que vencieron pero SÍ tienen recargas pendientes (packs de 3/6
 *   meses) generan un ciclo nuevo: una membresía nueva con otros 12
 *   créditos y 30 días más, encadenada a la misma compra original. Los
 *   créditos no usados del ciclo que termina NO pasan al nuevo — así lo
 *   decidió el gimnasio.
 *
 * Es idempotente y se puede correr tantas veces como haga falta: cada
 * membresía vencida se procesa una sola vez porque, apenas se marca
 * "expired", deja de matchear el filtro `status = 'active'`.
 */
export async function runDailyMembershipMaintenance(): Promise<{
  expired: number;
  renewed: number;
}> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();

  const due = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.status, "active"),
        lt(memberships.expiresAt, new Date())
      )
    );

  let expired = 0;
  let renewed = 0;

  for (const membership of due) {
    const unused = membership.creditsTotal - membership.creditsUsed;
    await db
      .update(memberships)
      .set({ status: "expired" })
      .where(eq(memberships.id, membership.id));
    if (unused > 0) {
      await logCreditMovement({
        membershipId: membership.id,
        delta: -unused,
        reason: "expired",
        note: `${unused} crédito(s) sin usar al vencer el ciclo`,
      });
    }
    expired += 1;

    if (membership.renewalsRemaining > 0) {
      const creditsTotal = creditsForTier(membership.tier);
      const [next] = await db
        .insert(memberships)
        .values({
          memberId: membership.memberId,
          purchaseId: membership.purchaseId,
          tier: membership.tier,
          creditsTotal,
          renewalsRemaining: membership.renewalsRemaining - 1,
          startsAt: membership.expiresAt,
          expiresAt: membershipExpiryFrom(membership.expiresAt),
        })
        .returning();
      await logCreditMovement({
        membershipId: next.id,
        delta: creditsTotal,
        reason: "purchase",
        note: "Recarga mensual automática del pack",
      });
      renewed += 1;
    }
  }

  return { expired, renewed };
}

// ---------------------------------------------------------------------------
// Profesores — Fase 1
// ---------------------------------------------------------------------------

export async function listCoaches() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db.select().from(coaches).orderBy(asc(coaches.name));
}

export async function createCoach(data: InsertCoach) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db.insert(coaches).values(data).returning();
  return row;
}

export async function updateCoach(id: number, patch: Partial<InsertCoach>) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(coaches)
    .set(patch)
    .where(eq(coaches.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Plantillas de horario y generación de clases — Fase 1
// ---------------------------------------------------------------------------

export async function listClassTemplates() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select()
    .from(classTemplates)
    .orderBy(asc(classTemplates.weekday), asc(classTemplates.startTime));
}

export async function createClassTemplate(data: InsertClassTemplate) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db.insert(classTemplates).values(data).returning();
  return row;
}

export async function updateClassTemplate(
  id: number,
  patch: Partial<InsertClassTemplate>
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(classTemplates)
    .set(patch)
    .where(eq(classTemplates.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Fechas bloqueadas (feriados/vacaciones) — Fase 1
// ---------------------------------------------------------------------------

export async function listClosedDates() {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db.select().from(closedDates).orderBy(asc(closedDates.date));
}

export async function createClosedDate(data: InsertClosedDate) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db.insert(closedDates).values(data).returning();
  return row;
}

export async function deleteClosedDate(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .delete(closedDates)
    .where(eq(closedDates.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Sesiones de clase — Fase 1
// ---------------------------------------------------------------------------

const WEEKDAY_GROUPS: Record<string, number[]> = {
  lwmf: [1, 3, 5], // lunes, miércoles, viernes
  tt: [2, 4], // martes, jueves
  sat: [6], // sábado
};

/** Si `class_templates` está vacía, la primera vez que se pide se puebla
 * con el horario real del gimnasio (shared/schedule.ts) — así el admin ve
 * de entrada el horario que ya existe en la web, en vez de una pantalla
 * vacía que obliga a tipear todo desde cero. */
export async function seedDefaultClassTemplatesIfEmpty(
  defaultCapacity: number
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const existing = await db
    .select({ id: classTemplates.id })
    .from(classTemplates)
    .limit(1);
  if (existing.length > 0) return;

  const { scheduleGroups } = await import("../shared/schedule.js");
  const rows: InsertClassTemplate[] = [];
  for (const group of scheduleGroups) {
    const weekdays = WEEKDAY_GROUPS[group.id] ?? [];
    for (const weekday of weekdays) {
      for (const slot of group.slots) {
        const [startTime, endTime] = slot.split(/[–-]/).map(s => s.trim());
        rows.push({ weekday, startTime, endTime, capacity: defaultCapacity });
      }
    }
  }
  if (rows.length > 0) {
    await db.insert(classTemplates).values(rows);
  }
}

/**
 * Genera las sesiones concretas de los próximos `weeks` a partir de
 * `fromDateStr` ("YYYY-MM-DD", día de Chile), una por cada plantilla activa
 * cuyo día de la semana coincida — saltando fechas bloqueadas
 * (`closed_dates`) y sin duplicar si la sesión ya existía (idempotente:
 * correrlo dos veces sobre el mismo rango no crea filas de más).
 */
export async function generateClassSessions(
  fromDateStr: string,
  weeks: number
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const { addDaysToDateString, weekdayOf, chileWallTimeToUtc } = await import(
    "../shared/chileTime.js"
  );

  const templates = await db
    .select()
    .from(classTemplates)
    .where(eq(classTemplates.active, true));
  const closed = new Set((await listClosedDates()).map(row => row.date));

  const totalDays = weeks * 7;
  let created = 0;
  for (let offset = 0; offset < totalDays; offset++) {
    const dateStr = addDaysToDateString(fromDateStr, offset);
    if (closed.has(dateStr)) continue;
    const weekday = weekdayOf(dateStr);

    for (const template of templates) {
      if (template.weekday !== weekday) continue;

      const already = await db
        .select({ id: classSessions.id })
        .from(classSessions)
        .where(
          and(
            eq(classSessions.templateId, template.id),
            eq(classSessions.date, dateStr)
          )
        )
        .limit(1);
      if (already[0]) continue;

      const [startHour, startMinute] = template.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = template.endTime.split(":").map(Number);
      const [y, m, d] = dateStr.split("-").map(Number);

      await db.insert(classSessions).values({
        templateId: template.id,
        date: dateStr,
        startsAt: chileWallTimeToUtc(y, m, d, startHour, startMinute),
        endsAt: chileWallTimeToUtc(y, m, d, endHour, endMinute),
        capacity: template.capacity,
        coachId: template.coachId,
      });
      created += 1;
    }
  }
  return created;
}

export async function getSessionById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, id))
    .limit(1);
  return result[0];
}

/** Todas las sesiones de un día (para la vista de día del panel admin). */
export async function listSessionsForDate(date: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select()
    .from(classSessions)
    .where(eq(classSessions.date, date))
    .orderBy(asc(classSessions.startsAt));
}

/** Agenda para el alumno: sesiones programadas entre hoy y `days` días,
 * junto con su propia reserva (si tiene una) en cada una. */
export async function listUpcomingSessionsForMember(
  memberId: number,
  days: number
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const { chileDateString, addDaysToDateString } = await import(
    "../shared/chileTime.js"
  );
  const fromDate = chileDateString();
  const toDate = addDaysToDateString(fromDate, days);

  const sessions = await db
    .select()
    .from(classSessions)
    .where(
      and(
        gte(classSessions.date, fromDate),
        lt(classSessions.date, toDate),
        eq(classSessions.status, "scheduled")
      )
    )
    .orderBy(asc(classSessions.startsAt));

  if (sessions.length === 0) return [];

  const myBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.memberId, memberId),
        inArray(
          bookings.sessionId,
          sessions.map(s => s.id)
        ),
        inArray(bookings.status, ["booked", "waitlisted"])
      )
    );
  const bookingBySession = new Map(myBookings.map(b => [b.sessionId, b]));

  return sessions.map(session => ({
    session,
    myBooking: bookingBySession.get(session.id),
  }));
}

/** Cancela una sesión completa (feriado, imprevisto) — devuelve el crédito
 * a todos los que tenían un cupo confirmado y deja las reservas en
 * "cancelled". Retorna las reservas afectadas (con su membershipId) para
 * que el caller (endpoint) les avise por email. */
export async function cancelClassSession(sessionId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const session = await getSessionById(sessionId);
  if (!session)
    return {
      session: undefined,
      affected: [] as (typeof bookings.$inferSelect)[],
    };

  await db
    .update(classSessions)
    .set({ status: "cancelled" })
    .where(eq(classSessions.id, sessionId));

  const active = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.sessionId, sessionId),
        inArray(bookings.status, ["booked", "waitlisted"])
      )
    );

  for (const booking of active) {
    await db
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(bookings.id, booking.id));
    if (booking.status === "booked" && booking.membershipId) {
      await refundCreditAtomic(booking.membershipId);
      await logCreditMovement({
        membershipId: booking.membershipId,
        delta: 1,
        reason: "cancel",
        bookingId: booking.id,
        note: "Clase cancelada por el gimnasio",
      });
    }
  }

  return { session, affected: active };
}

/** Bloquea una fecha (feriado/vacaciones) y cancela cualquier sesión que
 * ya se hubiera generado para ese día — devuelve las sesiones afectadas
 * (con sus reservas) para que el caller notifique a los alumnos. */
export async function blockDateAndCancelSessions(date: string, reason: string) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const closedDate = await createClosedDate({ date, reason });

  const affectedSessions = await db
    .select()
    .from(classSessions)
    .where(
      and(eq(classSessions.date, date), eq(classSessions.status, "scheduled"))
    );

  const results = [];
  for (const s of affectedSessions) {
    results.push(await cancelClassSession(s.id));
  }
  return { closedDate, results };
}

// ---------------------------------------------------------------------------
// Reservas — Fase 1
//
// El driver neon-http no soporta transacciones (ver nota en
// server/lib/mercadopago.ts sobre por qué esto importa). La atomicidad de
// "nunca vender más cupos que el aforo" y "nunca gastar un crédito que no
// existe" vive en UPDATEs condicionales de una sola sentencia — Postgres
// serializa esos UPDATEs a nivel de fila por sí solo, sin necesitar un
// BEGIN/COMMIT explícito — y cualquier paso posterior que falle revierte
// (compensa) el que ya se aplicó.
// ---------------------------------------------------------------------------

/** Intenta tomar 1 cupo de la sesión de forma atómica. Es el punto que
 * garantiza que `bookedCount` nunca supere `capacity` aunque dos personas
 * reserven en el mismo instante por el último lugar: solo uno de los dos
 * UPDATE concurrentes va a matchear la condición `bookedCount < capacity`. */
async function tryReserveSessionSlot(sessionId: number): Promise<boolean> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(classSessions)
    .set({ bookedCount: sql`${classSessions.bookedCount} + 1` })
    .where(
      and(
        eq(classSessions.id, sessionId),
        eq(classSessions.status, "scheduled"),
        sql`${classSessions.bookedCount} < ${classSessions.capacity}`
      )
    )
    .returning();
  return !!row;
}

async function releaseSessionSlot(sessionId: number): Promise<void> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  await db
    .update(classSessions)
    .set({ bookedCount: sql`GREATEST(${classSessions.bookedCount} - 1, 0)` })
    .where(eq(classSessions.id, sessionId));
}

export type BookSessionError =
  | "no_credits"
  | "already_booked_today"
  | "not_found";
export type BookSessionResult =
  | { ok: true; booking: typeof bookings.$inferSelect }
  | { ok: false; error: BookSessionError };

/**
 * Reserva (o pone en lista de espera) a un alumno en una sesión. La
 * elegibilidad de ventana de tiempo (¿está dentro de los 30 días? ¿ya
 * cerró la inscripción?) se valida ANTES de llamar a esto, en el endpoint,
 * con shared/booking.ts — esta función solo hace la mutación atómica.
 */
export async function bookSession(params: {
  memberId: number;
  sessionId: number;
  sessionDate: string;
}): Promise<BookSessionResult> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();

  const reserved = await tryReserveSessionSlot(params.sessionId);

  if (reserved) {
    const membership = await getMembershipToConsumeFor(params.memberId);
    if (!membership) {
      await releaseSessionSlot(params.sessionId);
      return { ok: false, error: "no_credits" };
    }
    const consumed = await consumeCreditAtomic(membership.id);
    if (!consumed) {
      // Carrera perdida: otra reserva simultánea del mismo alumno gastó el
      // último crédito de esta membresía entre que la leímos y la usamos.
      await releaseSessionSlot(params.sessionId);
      return { ok: false, error: "no_credits" };
    }

    try {
      const [booking] = await db
        .insert(bookings)
        .values({
          sessionId: params.sessionId,
          memberId: params.memberId,
          membershipId: membership.id,
          sessionDate: params.sessionDate,
          status: "booked",
        })
        .returning();
      await logCreditMovement({
        membershipId: membership.id,
        delta: -1,
        reason: "booking",
        bookingId: booking.id,
      });
      return { ok: true, booking };
    } catch (error) {
      // Compensar ambos pasos ya aplicados antes de propagar el error.
      await releaseSessionSlot(params.sessionId);
      await refundCreditAtomic(membership.id);
      if (isUniqueViolation(error)) {
        return { ok: false, error: "already_booked_today" };
      }
      throw error;
    }
  }

  // Sesión llena: entra a lista de espera, sin tocar créditos todavía — se
  // decide qué membresía se usa recién cuando le toque el turno (ver
  // promoteNextWaitlisted), porque para entonces la situación de créditos
  // del alumno puede haber cambiado.
  const [{ nextPosition }] = await db
    .select({
      nextPosition: sql<number>`coalesce(max(${bookings.position}), 0) + 1`,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.sessionId, params.sessionId),
        eq(bookings.status, "waitlisted")
      )
    );

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        sessionId: params.sessionId,
        memberId: params.memberId,
        sessionDate: params.sessionDate,
        status: "waitlisted",
        position: nextPosition,
      })
      .returning();
    return { ok: true, booking };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "already_booked_today" };
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function getBookingById(id: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return result[0];
}

export type CancelBookingResult =
  | {
      ok: true;
      booking: typeof bookings.$inferSelect;
      promoted?: typeof bookings.$inferSelect;
    }
  | { ok: false; error: "not_found" | "not_cancellable" };

/** Cancela una reserva. `refundCredit` lo decide el endpoint (con
 * shared/booking.ts: cancelRefundsCredit según la ventana de 2 horas). Si
 * se liberó un cupo confirmado, intenta promover al siguiente en la lista
 * de espera. */
export async function cancelBooking(
  bookingId: number,
  memberId: number,
  refundCredit: boolean
): Promise<CancelBookingResult> {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const booking = await getBookingById(bookingId);
  if (!booking || booking.memberId !== memberId) {
    return { ok: false, error: "not_found" };
  }
  if (booking.status !== "booked" && booking.status !== "waitlisted") {
    return { ok: false, error: "not_cancellable" };
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (booking.status === "waitlisted") {
    return { ok: true, booking: updated };
  }

  await releaseSessionSlot(booking.sessionId);
  if (refundCredit && booking.membershipId) {
    await refundCreditAtomic(booking.membershipId);
    await logCreditMovement({
      membershipId: booking.membershipId,
      delta: 1,
      reason: "cancel",
      bookingId: booking.id,
    });
  }

  const promoted = await promoteNextWaitlisted(booking.sessionId);
  return { ok: true, booking: updated, promoted };
}

/** Cuando se libera un cupo, ofrece el lugar al primero en la lista de
 * espera que todavía tenga créditos disponibles — si el primero ya no
 * califica (le vencieron los créditos mientras esperaba), prueba con el
 * siguiente, sin saltarse a nadie que sí pueda tomarlo. */
export async function promoteNextWaitlisted(sessionId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const candidates = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.sessionId, sessionId), eq(bookings.status, "waitlisted"))
    )
    .orderBy(asc(bookings.position), asc(bookings.createdAt));

  for (const candidate of candidates) {
    const membership = await getMembershipToConsumeFor(candidate.memberId);
    if (!membership) continue;

    const reserved = await tryReserveSessionSlot(sessionId);
    if (!reserved) return undefined; // se llenó de nuevo mientras tanto

    const consumed = await consumeCreditAtomic(membership.id);
    if (!consumed) {
      await releaseSessionSlot(sessionId);
      continue;
    }

    const [promoted] = await db
      .update(bookings)
      .set({ status: "booked", membershipId: membership.id })
      .where(eq(bookings.id, candidate.id))
      .returning();
    await logCreditMovement({
      membershipId: membership.id,
      delta: -1,
      reason: "booking",
      bookingId: promoted.id,
      note: "Promovido desde lista de espera",
    });
    return promoted;
  }
  return undefined;
}

export async function listUpcomingBookingsForMember(memberId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select({ booking: bookings, session: classSessions })
    .from(bookings)
    .innerJoin(classSessions, eq(bookings.sessionId, classSessions.id))
    .where(
      and(
        eq(bookings.memberId, memberId),
        inArray(bookings.status, ["booked", "waitlisted"])
      )
    )
    .orderBy(asc(classSessions.startsAt));
}

export async function listBookingHistoryForMember(memberId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select({ booking: bookings, session: classSessions })
    .from(bookings)
    .innerJoin(classSessions, eq(bookings.sessionId, classSessions.id))
    .where(eq(bookings.memberId, memberId))
    .orderBy(desc(classSessions.startsAt));
}

/** El roster de una sesión para el panel admin: cada reserva activa con el
 * nombre del alumno, para pasar asistencia. */
export async function listBookingsForSession(sessionId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  return db
    .select({ booking: bookings, member: members })
    .from(bookings)
    .innerJoin(members, eq(bookings.memberId, members.id))
    .where(eq(bookings.sessionId, sessionId))
    .orderBy(
      asc(bookings.status),
      asc(bookings.position),
      asc(bookings.createdAt)
    );
}

export async function setBookingAttendance(
  bookingId: number,
  status: "attended" | "no_show"
) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const [row] = await db
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, bookingId))
    .returning();
  // Una reserva "booked" siempre tiene membershipId (se asigna al reservar
  // o al promoverla desde la lista de espera) — el `if` es solo por si
  // algún día se llama esto sobre un estado inesperado.
  if (row && status === "no_show" && row.membershipId) {
    await logCreditMovement({
      membershipId: row.membershipId,
      delta: 0,
      reason: "no_show",
      bookingId: row.id,
      note: "El crédito ya se había descontado al reservar",
    });
  }
  return row;
}

/** Cierra la asistencia de una sesión: todo lo que seguía "booked" sin
 * marcar (nadie tocó ni "asistió" ni "no llegó") se cierra como no-show —
 * el crédito ya se había descontado al reservar, así que no hay más
 * movimiento que registrar más allá del marcador de auditoría. */
export async function closeSessionAttendance(sessionId: number) {
  const db = getDb();
  if (!db) throw databaseNotConfigured();
  const pending = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.sessionId, sessionId), eq(bookings.status, "booked"))
    );

  for (const booking of pending) {
    await setBookingAttendance(booking.id, "no_show");
  }
  return pending.length;
}
