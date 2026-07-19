import {
  boolean,
  date,
  index,
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
    ...timestamps,
  },
  (table) => [
    index('content_items_organization_id_idx').on(table.organizationId),
    index('content_items_client_id_idx').on(table.clientId),
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

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  organizationMember,
  client,
  clientMember,
  contentItem,
  contentPlatformTarget,
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
