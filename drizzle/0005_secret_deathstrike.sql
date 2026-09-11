CREATE TYPE "public"."booking_status" AS ENUM('booked', 'waitlisted', 'cancelled', 'attended', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."class_session_status" AS ENUM('scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."credit_ledger_reason" AS ENUM('purchase', 'booking', 'cancel', 'no_show', 'admin_adjust', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."student_certificate_status" AS ENUM('not_applicable', 'pending_verification', 'verified');--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auth_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"memberId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"memberId" integer NOT NULL,
	"membershipId" integer,
	"sessionDate" varchar(10) NOT NULL,
	"status" "booking_status" DEFAULT 'booked' NOT NULL,
	"position" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"cancelledAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "class_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"templateId" integer,
	"date" varchar(10) NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp NOT NULL,
	"capacity" integer NOT NULL,
	"bookedCount" integer DEFAULT 0 NOT NULL,
	"coachId" integer,
	"status" "class_session_status" DEFAULT 'scheduled' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_templates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "class_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"weekday" integer NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"capacity" integer NOT NULL,
	"coachId" integer,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closed_dates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "closed_dates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" varchar(10) NOT NULL,
	"reason" varchar(200),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "closed_dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coaches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credit_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"membershipId" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" "credit_ledger_reason" NOT NULL,
	"bookingId" integer,
	"note" varchar(300),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(320) NOT NULL,
	"fullName" varchar(200) NOT NULL,
	"rut" varchar(16),
	"whatsapp" varchar(32),
	"audience" "plan_audience" DEFAULT 'general' NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"studentCertificateStatus" "student_certificate_status" DEFAULT 'not_applicable' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "memberships_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"memberId" integer NOT NULL,
	"purchaseId" integer,
	"tier" "plan_tier" NOT NULL,
	"creditsTotal" integer NOT NULL,
	"creditsUsed" integer DEFAULT 0 NOT NULL,
	"renewalsRemaining" integer DEFAULT 0 NOT NULL,
	"startsAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "mpFeeRateBps" integer DEFAULT 350 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "defaultCapacity" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "bookingOpenDays" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "bookingCloseMinutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "cancelWindowHours" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_purchases" ADD COLUMN "memberId" integer;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sessionId_class_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_membershipId_memberships_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_templateId_class_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."class_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_coachId_coaches_id_fk" FOREIGN KEY ("coachId") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_templates" ADD CONSTRAINT "class_templates_coachId_coaches_id_fk" FOREIGN KEY ("coachId") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_membershipId_memberships_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_purchaseId_plan_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."plan_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_one_active_per_day" ON "bookings" USING btree ("memberId","sessionDate") WHERE "bookings"."status" in ('booked','waitlisted');--> statement-breakpoint
ALTER TABLE "plan_purchases" ADD CONSTRAINT "plan_purchases_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;