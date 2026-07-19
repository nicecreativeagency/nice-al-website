CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"created_by_user_id" text,
	"title" text NOT NULL,
	"content_type" text DEFAULT 'image_post' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"scheduled_date" date,
	"scheduled_time" time,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_platform_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"platform" text NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_platform_targets" ADD CONSTRAINT "content_platform_targets_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_items_organization_id_idx" ON "content_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "content_items_client_id_idx" ON "content_items" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "content_items_status_idx" ON "content_items" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "content_items_schedule_idx" ON "content_items" USING btree ("organization_id","scheduled_date");--> statement-breakpoint
CREATE UNIQUE INDEX "content_platform_targets_item_platform_idx" ON "content_platform_targets" USING btree ("content_item_id","platform");--> statement-breakpoint
CREATE INDEX "content_platform_targets_item_id_idx" ON "content_platform_targets" USING btree ("content_item_id");