CREATE TYPE "public"."plan_audience" AS ENUM('general', 'student');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('single', 'eight', 'twelve');--> statement-breakpoint
CREATE TABLE "plan_purchases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plan_purchases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fullName" varchar(200) NOT NULL,
	"rut" varchar(16) NOT NULL,
	"whatsapp" varchar(32) NOT NULL,
	"email" varchar(320) NOT NULL,
	"audience" "plan_audience" NOT NULL,
	"tier" "plan_tier" NOT NULL,
	"planLabel" varchar(60) NOT NULL,
	"status" "registration_status" DEFAULT 'pending' NOT NULL,
	"mpPaymentId" varchar(64),
	"amount" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
