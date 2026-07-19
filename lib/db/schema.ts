import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

export const user = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  ...timestamps,
})

export const session = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const account = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (table) => [
    index('accounts_user_id_idx').on(table.userId),
    uniqueIndex('accounts_provider_account_idx').on(table.providerId, table.accountId),
  ],
)

export const verification = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export const organization = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ...timestamps,
})

export const organizationMember = pgTable(
  'organization_members',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('organization_members_org_user_idx').on(
      table.organizationId,
      table.userId,
    ),
    index('organization_members_user_id_idx').on(table.userId),
  ],
)

export const client = pgTable(
  'clients',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    brandColor: text('brand_color').default('#111111').notNull(),
    timezone: text('timezone').default('Europe/Berlin').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('clients_org_slug_idx').on(table.organizationId, table.slug),
    index('clients_organization_id_idx').on(table.organizationId),
  ],
)

export const clientMember = pgTable(
  'client_members',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').default('client').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('client_members_client_user_idx').on(table.clientId, table.userId),
    index('client_members_user_id_idx').on(table.userId),
  ],
)

export const campaign = pgTable(
  'campaigns',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    status: text('status').default('active').notNull(),
    ...timestamps,
  },
  (table) => [
    index('campaigns_organization_id_idx').on(table.organizationId),
    index('campaigns_client_id_idx').on(table.clientId),
    index('campaigns_date_idx').on(table.organizationId, table.startDate),
  ],
)

export const contentItem = pgTable(
  'content_items',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    campaignId: text('campaign_id').references(() => campaign.id, {
      onDelete: 'set null',
    }),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    contentType: text('content_type').default('image_post').notNull(),
    status: text('status').default('draft').notNull(),
    caption: text('caption').default('').notNull(),
    scheduledDate: date('scheduled_date'),
    scheduledTime: time('scheduled_time'),
    timezone: text('timezone').notNull(),
    currentVersion: integer('current_version').default(1).notNull(),
    approvedVersion: integer('approved_version'),
    ...timestamps,
  },
  (table) => [
    index('content_items_organization_id_idx').on(table.organizationId),
    index('content_items_client_id_idx').on(table.clientId),
    index('content_items_campaign_id_idx').on(table.campaignId),
    index('content_items_status_idx').on(table.organizationId, table.status),
    index('content_items_schedule_idx').on(
      table.organizationId,
      table.scheduledDate,
    ),
  ],
)

export const contentPlatformTarget = pgTable(
  'content_platform_targets',
  {
    id: text('id').primaryKey(),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItem.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    caption: text('caption'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('content_platform_targets_item_platform_idx').on(
      table.contentItemId,
      table.platform,
    ),
    index('content_platform_targets_item_id_idx').on(table.contentItemId),
  ],
)

export const contentVersion = pgTable(
  'content_versions',
  {
    id: text('id').primaryKey(),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItem.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    contentType: text('content_type').notNull(),
    caption: text('caption').default('').notNull(),
    platformSnapshot: jsonb('platform_snapshot').$type<
      Array<{ platform: string; caption: string | null }>
    >(),
    mediaSnapshot: jsonb('media_snapshot').$type<
      Array<{
        mediaAssetId: string
        secureUrl: string
        resourceType: string
        sortOrder: number
      }>
    >(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('content_versions_item_version_idx').on(
      table.contentItemId,
      table.versionNumber,
    ),
    index('content_versions_item_id_idx').on(table.contentItemId),
  ],
)

export const mediaAsset = pgTable(
  'media_assets',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    uploadedByUserId: text('uploaded_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    provider: text('provider').default('cloudinary').notNull(),
    providerAssetId: text('provider_asset_id').notNull(),
    publicId: text('public_id').notNull(),
    resourceType: text('resource_type').notNull(),
    format: text('format'),
    secureUrl: text('secure_url').notNull(),
    originalFilename: text('original_filename'),
    width: integer('width'),
    height: integer('height'),
    bytes: integer('bytes'),
    duration: doublePrecision('duration'),
    version: integer('version'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('media_assets_provider_asset_idx').on(
      table.provider,
      table.providerAssetId,
    ),
    index('media_assets_organization_id_idx').on(table.organizationId),
    index('media_assets_client_id_idx').on(table.clientId),
  ],
)

export const contentMedia = pgTable(
  'content_media',
  {
    id: text('id').primaryKey(),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItem.id, { onDelete: 'cascade' }),
    mediaAssetId: text('media_asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    altText: text('alt_text'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('content_media_item_asset_idx').on(
      table.contentItemId,
      table.mediaAssetId,
    ),
    index('content_media_item_id_idx').on(table.contentItemId),
    index('content_media_asset_id_idx').on(table.mediaAssetId),
  ],
)

export const approvalRequest = pgTable(
  'approval_requests',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItem.id, { onDelete: 'cascade' }),
    requestedByUserId: text('requested_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    decidedByUserId: text('decided_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    versionNumber: integer('version_number').notNull(),
    status: text('status').default('pending').notNull(),
    message: text('message').default('').notNull(),
    reviewerName: text('reviewer_name'),
    requestedAt: timestamp('requested_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('approval_requests_organization_id_idx').on(table.organizationId),
    index('approval_requests_content_id_idx').on(table.contentItemId),
    index('approval_requests_status_idx').on(
      table.organizationId,
      table.status,
    ),
  ],
)

export const approvalLink = pgTable(
  'approval_links',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    approvalRequestId: text('approval_request_id')
      .notNull()
      .references(() => approvalRequest.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('approval_links_request_id_idx').on(table.approvalRequestId),
    index('approval_links_organization_id_idx').on(table.organizationId),
  ],
)

export const campaignReviewLink = pgTable(
  'campaign_review_links',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaign.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('campaign_review_links_organization_id_idx').on(
      table.organizationId,
    ),
    index('campaign_review_links_campaign_id_idx').on(table.campaignId),
  ],
)

export const campaignReviewItem = pgTable(
  'campaign_review_items',
  {
    id: text('id').primaryKey(),
    campaignReviewLinkId: text('campaign_review_link_id')
      .notNull()
      .references(() => campaignReviewLink.id, { onDelete: 'cascade' }),
    approvalRequestId: text('approval_request_id')
      .notNull()
      .references(() => approvalRequest.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('campaign_review_items_link_approval_idx').on(
      table.campaignReviewLinkId,
      table.approvalRequestId,
    ),
    index('campaign_review_items_link_id_idx').on(
      table.campaignReviewLinkId,
    ),
    index('campaign_review_items_approval_id_idx').on(
      table.approvalRequestId,
    ),
  ],
)

export const approvalComment = pgTable(
  'approval_comments',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItem.id, { onDelete: 'cascade' }),
    approvalRequestId: text('approval_request_id').references(
      () => approvalRequest.id,
      { onDelete: 'set null' },
    ),
    authorUserId: text('author_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    authorName: text('author_name').notNull(),
    authorRole: text('author_role').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('approval_comments_content_id_idx').on(table.contentItemId),
    index('approval_comments_request_id_idx').on(table.approvalRequestId),
  ],
)

export const activityEvent = pgTable(
  'activity_events',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    clientId: text('client_id').references(() => client.id, {
      onDelete: 'set null',
    }),
    contentItemId: text('content_item_id').references(() => contentItem.id, {
      onDelete: 'cascade',
    }),
    actorUserId: text('actor_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, string | number | boolean>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('activity_events_organization_id_idx').on(table.organizationId),
    index('activity_events_content_id_idx').on(table.contentItemId),
    index('activity_events_created_at_idx').on(
      table.organizationId,
      table.createdAt,
    ),
  ],
)

export const notification = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    recipientUserId: text('recipient_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').default('').notNull(),
    href: text('href'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('notifications_recipient_id_idx').on(table.recipientUserId),
    index('notifications_unread_idx').on(table.recipientUserId, table.readAt),
  ],
)

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  organizationMember,
  client,
  clientMember,
  campaign,
  contentItem,
  contentPlatformTarget,
  contentVersion,
  mediaAsset,
  contentMedia,
  approvalRequest,
  approvalLink,
  campaignReviewLink,
  campaignReviewItem,
  approvalComment,
  activityEvent,
  notification,
}

export type Role = 'super_admin' | 'organization_admin' | 'team_member' | 'client'
export type ContentStatus =
  | 'draft'
  | 'waiting_approval'
  | 'changes_requested'
  | 'approved'
  | 'ready_to_schedule'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived'
export type ContentType =
  | 'image_post'
  | 'carousel'
  | 'video'
  | 'reel'
  | 'story'
export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'
export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'changes_requested'
  | 'cancelled'
