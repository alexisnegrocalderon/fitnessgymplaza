CREATE TABLE "mp_connections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mp_connections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mpUserId" varchar(64) NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text NOT NULL,
	"publicKey" varchar(128) NOT NULL,
	"liveMode" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"connectedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "mpPaymentId" varchar(64);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "amount" integer;