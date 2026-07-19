import 'server-only'

import { cache } from 'react'
import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  client,
  clientMember,
  contentItem,
  approvalRequest,
  notification,
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
  pendingApprovals: number
  unreadNotifications: number
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

  const clientIds = assignedClients.map((item) => item.id)
  const [pending] =
    membership.role === 'client' && clientIds.length === 0
      ? [{ value: 0 }]
      : await db
          .select({ value: count() })
          .from(approvalRequest)
          .innerJoin(contentItem, eq(contentItem.id, approvalRequest.contentItemId))
          .where(
            and(
              eq(approvalRequest.organizationId, membership.organizationId),
              eq(approvalRequest.status, 'pending'),
              membership.role === 'client'
                ? inArray(contentItem.clientId, clientIds)
                : undefined,
            ),
          )
  const [unread] = await db
    .select({ value: count() })
    .from(notification)
    .where(
      and(
        eq(notification.recipientUserId, session.user.id),
        isNull(notification.readAt),
      ),
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
    pendingApprovals: pending?.value ?? 0,
    unreadNotifications: unread?.value ?? 0,
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
