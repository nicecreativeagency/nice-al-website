import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const EXISTING_SCHEMA_BASELINE = 1784432480414

async function baselineExistingNeonSchema() {
  const { neon } = await import('@neondatabase/serverless')
  const query = neon(process.env.DATABASE_URL!)

  await query`CREATE SCHEMA IF NOT EXISTS drizzle`
  await query`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `

  const [history] = await query`
    SELECT count(*)::int AS count
    FROM drizzle.__drizzle_migrations
  `
  if (Number(history?.count ?? 0) > 0) return

  const [existing] = await query`
    SELECT
      to_regclass('public.content_items') IS NOT NULL AS content_items,
      to_regclass('public.content_platform_targets') IS NOT NULL AS platform_targets,
      to_regclass('public.media_assets') IS NOT NULL AS media_assets,
      to_regclass('public.content_media') IS NOT NULL AS content_media
  `
  const hasExistingFoundation = Boolean(existing?.content_items)
  if (!hasExistingFoundation) return

  const hasCompleteFoundation =
    Boolean(existing?.platform_targets) &&
    Boolean(existing?.media_assets) &&
    Boolean(existing?.content_media)
  if (!hasCompleteFoundation) {
    throw new Error(
      'The existing database schema is incomplete and cannot be baselined safely.',
    )
  }

  await query`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('nice-social-hub-existing-schema-baseline', ${EXISTING_SCHEMA_BASELINE})
  `
  console.log('Existing NICE Social Hub schema baseline recorded.')
}

async function migrate() {
  const migrationsFolder = './drizzle'

  if (process.env.DATABASE_URL) {
    await baselineExistingNeonSchema()
    const { migrate: migrateNeon } = await import('drizzle-orm/neon-http/migrator')
    const { db } = await import('../lib/db')
    await migrateNeon(db as Parameters<typeof migrateNeon>[0], { migrationsFolder })
    return
  }

  const { migrate: migratePglite } = await import('drizzle-orm/pglite/migrator')
  const { db } = await import('../lib/db')
  await migratePglite(db as Parameters<typeof migratePglite>[0], { migrationsFolder })
}

migrate()
  .then(() => {
    console.log('Database migrations completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database migration failed.', error)
    process.exit(1)
  })
