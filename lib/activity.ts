import 'server-only'

import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  activityEvent,
  clientMember,
  notification,
  organizationMember,
  user,
} from '@/lib/db/schema'
import {
  escapeEmailHtml,
  getPublicAppUrl,
  sendTransactionalEmail,
} from '@/lib/email'

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

  const rows = uniqueRecipients.map((recipientUserId) => ({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      recipientUserId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      href: input.href,
  }))
  await db.insert(notification).values(rows)

  const recipients = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(inArray(user.id, uniqueRecipients))
  const appUrl = getPublicAppUrl()
  const href = input.href ? `${appUrl}${input.href}` : `${appUrl}/hub/dashboard`

  await Promise.all(
    recipients.map(async (recipient) => {
      const delivery = await sendTransactionalEmail({
        to: recipient.email,
        subject: input.title,
        text: `${input.title}\n\n${input.body ?? ''}\n\nOpen NICE Social Hub: ${href}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#000">
            <p style="font-size:12px;text-transform:uppercase;letter-spacing:.12em">NICE Social Hub</p>
            <h1 style="font-size:30px;line-height:1.15">${escapeEmailHtml(input.title)}</h1>
            <p>Hi ${escapeEmailHtml(recipient.name)},</p>
            <p>${escapeEmailHtml(input.body ?? '')}</p>
            <p style="margin:30px 0">
              <a href="${href}" style="display:inline-block;background:#000;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px">Open Social Hub</a>
            </p>
          </div>
        `,
        idempotencyKey: `notification-${rows.find((row) => row.recipientUserId === recipient.id)?.id}`,
      })
      if (delivery.status === 'failed') {
        console.error('Notification email delivery failed', delivery.error)
      }
    }),
  )
}
