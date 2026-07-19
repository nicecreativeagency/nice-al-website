CREATE TABLE "content_media" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"media_asset_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"uploaded_by_user_id" text,
	"provider" text DEFAULT 'cloudinary' NOT NULL,
	"provider_asset_id" text NOT NULL,
	"public_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"format" text,
	"secure_url" text NOT NULL,
	"original_filename" text,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"duration" double precision,
	"version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_media_item_asset_idx" ON "content_media" USING btree ("content_item_id","media_asset_id");--> statement-breakpoint
CREATE INDEX "content_media_item_id_idx" ON "content_media" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_media_asset_id_idx" ON "content_media" USING btree ("media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_provider_asset_idx" ON "media_assets" USING btree ("provider","provider_asset_id");--> statement-breakpoint
CREATE INDEX "media_assets_organization_id_idx" ON "media_assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_assets_client_id_idx" ON "media_assets" USING btree ("client_id");