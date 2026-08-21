CREATE TABLE "event_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"serviceChargeBps" integer DEFAULT 1000 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
