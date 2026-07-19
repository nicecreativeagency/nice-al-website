import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function migrate() {
  const migrationsFolder = './drizzle'

  if (process.env.DATABASE_URL) {
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
