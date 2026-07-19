import { eq } from 'drizzle-orm'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())
process.env.ALLOW_DEV_SEED_SIGNUP = 'true'

const required = [
  'DEV_ADMIN_EMAIL',
  'DEV_ADMIN_PASSWORD',
  'DEV_CLIENT_EMAIL',
  'DEV_CLIENT_PASSWORD',
] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required to seed development users.`)
  }
}

async function ensureUser(name: string, email: string, password: string) {
  const { auth } = await import('../lib/auth')
  const { db } = await import('../lib/db')
  const { user } = await import('../lib/db/schema')

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing[0]) return existing[0]

  const result = await auth.api.signUpEmail({
    body: { name, email, password },
  })
  return result.user
}

async function seed() {
  const { db } = await import('../lib/db')
  const {
    client,
    clientMember,
    organization,
    organizationMember,
  } = await import('../lib/db/schema')

  const admin = await ensureUser(
    'Erzen Arifi',
    process.env.DEV_ADMIN_EMAIL!,
    process.env.DEV_ADMIN_PASSWORD!,
  )
  const clientUser = await ensureUser(
    'Client A',
    process.env.DEV_CLIENT_EMAIL!,
    process.env.DEV_CLIENT_PASSWORD!,
  )

  const orgId = 'org_nice'
  const demoClientId = 'client_demo'

  await db
    .insert(organization)
    .values({
      id: orgId,
      name: 'NICE Creative Agency',
      slug: 'nice',
    })
    .onConflictDoNothing()

  await db
    .insert(client)
    .values({
      id: demoClientId,
      organizationId: orgId,
      name: 'Demo Client',
      slug: 'demo-client',
      brandColor: '#ff5a36',
      timezone: 'Europe/Berlin',
    })
    .onConflictDoNothing()

  await db
    .insert(organizationMember)
    .values([
      {
        id: 'org_member_admin',
        organizationId: orgId,
        userId: admin.id,
        role: 'super_admin',
      },
      {
        id: 'org_member_client',
        organizationId: orgId,
        userId: clientUser.id,
        role: 'client',
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(clientMember)
    .values({
      id: 'client_member_demo',
      clientId: demoClientId,
      userId: clientUser.id,
      role: 'client',
    })
    .onConflictDoNothing()

  console.log('Development users and Demo Client are ready.')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Database seed failed.', error)
    process.exit(1)
  })
