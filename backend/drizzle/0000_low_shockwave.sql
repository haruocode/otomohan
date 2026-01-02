CREATE TABLE "call_billing_units" (
	"unit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" varchar(64) NOT NULL,
	"minute_index" integer NOT NULL,
	"charged_points" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"call_id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"otomo_id" varchar(64) NOT NULL,
	"started_at" timestamp NOT NULL,
	"connected_at" timestamp,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"billed_units" integer DEFAULT 0 NOT NULL,
	"billed_points" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'requesting' NOT NULL,
	"end_reason" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "otomo_profiles" (
	"otomo_id" varchar(64) PRIMARY KEY NOT NULL,
	"owner_user_id" varchar(64) NOT NULL,
	"display_name" text NOT NULL,
	"profile_image_url" text,
	"age" integer,
	"gender" varchar(16),
	"introduction" text,
	"tags" text[],
	"genres" text[],
	"status_message" text,
	"is_online" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"price_per_minute" integer DEFAULT 120 NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_settings" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"incoming_call" boolean DEFAULT true NOT NULL,
	"call_summary" boolean DEFAULT true NOT NULL,
	"wallet_alert" boolean DEFAULT true NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"gender" varchar(16),
	"birthday" timestamp,
	"balance" integer DEFAULT 0 NOT NULL,
	"password_hash" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallet_balances" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_charges" (
	"charge_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"plan_id" varchar(64),
	"payment_id" text,
	"amount_yen" integer NOT NULL,
	"granted_points" integer NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_plans" (
	"plan_id" varchar(64) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"price_yen" integer NOT NULL,
	"points" integer NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_usages" (
	"usage_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"call_id" varchar(64) NOT NULL,
	"otomo_id" varchar(64) NOT NULL,
	"used_points" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_billing_units" ADD CONSTRAINT "call_billing_units_call_id_calls_call_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("call_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_otomo_id_otomo_profiles_otomo_id_fk" FOREIGN KEY ("otomo_id") REFERENCES "public"."otomo_profiles"("otomo_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otomo_profiles" ADD CONSTRAINT "otomo_profiles_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_charges" ADD CONSTRAINT "wallet_charges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_charges" ADD CONSTRAINT "wallet_charges_plan_id_wallet_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."wallet_plans"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_usages" ADD CONSTRAINT "wallet_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_usages" ADD CONSTRAINT "wallet_usages_otomo_id_otomo_profiles_otomo_id_fk" FOREIGN KEY ("otomo_id") REFERENCES "public"."otomo_profiles"("otomo_id") ON DELETE no action ON UPDATE no action;