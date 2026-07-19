import { PGlite } from '@electric-sql/pglite'
import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as tables from './schema'

const globalForDatabase = globalThis as unknown as {
  nicePglite?: PGlite
}

const databaseUrl = process.env.DATABASE_URL

function createDatabase() {
  if (databaseUrl || process.env.NODE_ENV === 'production') {
    const connectionString =
      databaseUrl ?? 'postgresql://build:build@localhost:5432/build'
    return drizzleNeon(neon(connectionString), { schema: tables })
  }

  const localDataDirectory = resolve(
    process.env.PGLITE_DATA_DIR ?? './.data/nice-social-hub',
  )
  mkdirSync(localDataDirectory, { recursive: true })

  const client =
    globalForDatabase.nicePglite ??
    new PGlite(localDataDirectory)

  globalForDatabase.nicePglite = client

  return drizzlePglite(client, { schema: tables })
}

/**
 * Both drivers implement Drizzle's PostgreSQL query API. The narrow boundary
 * keeps local PGlite and production Neon interchangeable without leaking
 * provider-specific behavior into the rest of the application.
 */
export const db = createDatabase()
export const isLocalDatabase = !databaseUrl && process.env.NODE_ENV !== 'production'
