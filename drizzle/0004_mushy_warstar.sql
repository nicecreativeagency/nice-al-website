CREATE TABLE "campaign_review_items" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_review_link_id" text NOT NULL,
	"approval_request_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_review_links" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_review_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "campaign_review_items" ADD CONSTRAINT "campaign_review_items_campaign_review_link_id_campaign_review_links_id_fk" FOREIGN KEY ("campaign_review_link_id") REFERENCES "public"."campaign_review_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_review_items" ADD CONSTRAINT "campaign_review_items_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_review_links" ADD CONSTRAINT "campaign_review_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_review_links" ADD CONSTRAINT "campaign_review_links_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_review_links" ADD CONSTRAINT "campaign_review_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_review_items_link_approval_idx" ON "campaign_review_items" USING btree ("campaign_review_link_id","approval_request_id");--> statement-breakpoint
CREATE INDEX "campaign_review_items_link_id_idx" ON "campaign_review_items" USING btree ("campaign_review_link_id");--> statement-breakpoint
CREATE INDEX "campaign_review_items_approval_id_idx" ON "campaign_review_items" USING btree ("approval_request_id");--> statement-breakpoint
CREATE INDEX "campaign_review_links_organization_id_idx" ON "campaign_review_links" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "campaign_review_links_campaign_id_idx" ON "campaign_review_links" USING btree ("campaign_id");