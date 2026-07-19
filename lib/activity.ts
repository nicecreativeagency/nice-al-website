import 'server-only'

import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  activityEvent,
  clientMember,
  notification,
  organizationMember,
} from '@/lib/db/schema'

type Actor = {
  id?: string | null
  name: string
}

export async function recordActivity(input: {
  organizationId: string
  clientId?: string | null
  contentItemId?: string | null
  actor: Actor
  action: string
  metadata?: Record<string, string | number | boolean>
}) {
  await db.insert(activityEvent).values({
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    clientId: input.clientId,
    contentItemId: input.contentItemId,
    actorUserId: input.actor.id,
    actorName: input.actor.name,
    action: input.action,
    metadata: input.metadata,
  })
}

export async function getOrganizationAdminIds(organizationId: string) {
  const rows = await db
    .select({ userId: organizationMember.userId })
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, organizationId),
        inArray(organizationMember.role, ['super_admin', 'organization_admin']),
      ),
    )

  return rows.map((row) => row.userId)
}

export async function getClientReviewerIds(clientId: string) {
  const rows = await db
    .select({ userId: clientMember.userId })
    .from(clientMember)
    .where(eq(clientMember.clientId, clientId))

  return rows.map((row) => row.userId)
}

export async function createNotifications(input: {
  organizationId: string
  recipientUserIds: string[]
  type: string
  title: string
  body?: string
  href?: string
}) {
  const uniqueRecipients = Array.from(new Set(input.recipientUserIds))
  if (uniqueRecipients.length === 0) return

  await db.insert(notification).values(
    uniqueRecipients.map((recipientUserId) => ({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      recipientUserId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      href: input.href,
    })),
  )
}
