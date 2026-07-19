import 'server-only'

import { cache } from 'react'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  client,
  clientMember,
  organization,
  organizationMember,
  type Role,
} from '@/lib/db/schema'

export type Viewer = {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
  }
  role: Role
  clients: Array<{
    id: string
    name: string
    slug: string
    brandColor: string
    timezone: string
  }>
}

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getSession()
  if (!session) return null

  const memberships = await db
    .select({
      role: organizationMember.role,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
    })
    .from(organizationMember)
    .innerJoin(
      organization,
      eq(organization.id, organizationMember.organizationId),
    )
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1)

  const membership = memberships[0]
  if (!membership) return null

  const assignedClients = await db
    .select({
      id: client.id,
      name: client.name,
      slug: client.slug,
      brandColor: client.brandColor,
      timezone: client.timezone,
    })
    .from(client)
    .leftJoin(
      clientMember,
      and(
        eq(clientMember.clientId, client.id),
        eq(clientMember.userId, session.user.id),
      ),
    )
    .where(
      membership.role === 'client'
        ? eq(clientMember.userId, session.user.id)
        : eq(client.organizationId, membership.organizationId),
    )

  return {
    user: session.user,
    organization: {
      id: membership.organizationId,
      name: membership.organizationName,
      slug: membership.organizationSlug,
    },
    role: membership.role as Role,
    clients: assignedClients,
  }
})

export async function requireViewer() {
  const viewer = await getViewer()
  if (!viewer) redirect('/hub/login')
  return viewer
}

export async function requireAdmin() {
  const viewer = await requireViewer()
  if (!['super_admin', 'organization_admin'].includes(viewer.role)) {
    redirect('/hub/dashboard?notice=access-denied')
  }
  return viewer
}
