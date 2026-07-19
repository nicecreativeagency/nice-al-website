import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import { schema } from '@/lib/db/schema'

const canSeedDevelopmentUsers =
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_DEV_SEED_SIGNUP === 'true'

const authBaseUrl = process.env.BETTER_AUTH_URL

export const auth = betterAuth({
  appName: 'NICE Social Hub',
  baseURL: {
    allowedHosts: [
      'nice.al',
      'www.nice.al',
      'nice-al-website.vercel.app',
      'nice-al-website-*.vercel.app',
      'localhost:*',
    ],
    protocol: 'auto',
    ...(authBaseUrl ? { fallback: authBaseUrl } : {}),
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !canSeedDevelopmentUsers,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  plugins: [nextCookies()],
})
