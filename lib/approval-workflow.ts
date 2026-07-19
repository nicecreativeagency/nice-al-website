import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { and, count, eq } from 'drizzle-orm'
import {
  createNotifications,
  getOrganizationAdminIds,
  recordActivity,
} from '@/lib/activity'
import { getContentReadiness } from '@/lib/content-readiness'
import { db } from '@/lib/db'
import {
  approvalComment,
  approvalRequest,
  client,
  contentItem,
  contentMedia,
  contentPlatformTarget,
  contentVersion,
  type SocialPlatform,
} from '@/lib/db/schema'

export function createReviewToken() {
  return randomBytes(32).toString('base64url')
}

export function hashReviewToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getApprovalReview(approvalId: string) {
  const [review] = await db
    .select({
      id: approvalRequest.id,
      organizationId: approvalRequest.organizationId,
      contentItemId: approvalRequest.contentItemId,
      versionNumber: approvalRequest.versionNumber,
      approvalStatus: approvalRequest.status,
      message: approvalRequest.message,
      requestedAt: approvalRequest.requestedAt,
      decidedAt: approvalRequest.decidedAt,
      title: contentItem.title,
      contentType: contentItem.contentType,
      contentStatus: contentItem.status,
      caption: contentItem.caption,
      scheduledDate: contentItem.scheduledDate,
      scheduledTime: contentItem.scheduledTime,
      timezone: contentItem.timezone,
      currentVersion: contentItem.currentVersion,
      versionTitle: contentVersion.title,
      versionCaption: contentVersion.caption,
      platformSnapshot: contentVersion.platformSnapshot,
      mediaSnapshot: contentVersion.mediaSnapshot,
      clientId: client.id,
      clientName: client.name,
      clientColor: client.brandColor,
    })
    .from(approvalRequest)
    .innerJoin(contentItem, eq(contentItem.id, approvalRequest.contentItemId))
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .leftJoin(
      contentVersion,
      and(
        eq(contentVersion.contentItemId, contentItem.id),
        eq(contentVersion.versionNumber, approvalRequest.versionNumber),
      ),
    )
    .where(eq(approvalRequest.id, approvalId))
    .limit(1)

  return review
}

export async function decideApproval(input: {
  approvalId: string
  decision: 'approved' | 'changes_requested'
  comment?: string
  actor: {
    userId?: string | null
    name: string
    role: string
  }
}) {
  const review = await getApprovalReview(input.approvalId)
  if (!review) return { ok: false, error: 'Approval request not found.' }
  if (review.approvalStatus !== 'pending') {
    return { ok: false, error: 'This approval request is already closed.' }
  }

  const comment = input.comment?.trim()
  if (input.decision === 'changes_requested' && !comment) {
    return { ok: false, error: 'Explain what NICE should change.' }
  }

  const targets = await db
    .select({
      platform: contentPlatformTarget.platform,
      caption: contentPlatformTarget.caption,
    })
    .from(contentPlatformTarget)
    .where(eq(contentPlatformTarget.contentItemId, review.contentItemId))
  const [media] = await db
    .select({ value: count() })
    .from(contentMedia)
    .where(eq(contentMedia.contentItemId, review.contentItemId))
  const readiness = getContentReadiness({
    caption: review.caption,
    scheduledDate: review.scheduledDate,
    scheduledTime: review.scheduledTime,
    platforms: targets.map((target) => ({
      platform: target.platform as SocialPlatform,
      caption: target.caption,
    })),
    mediaCount: Number(media?.value ?? 0),
  })

  const now = new Date()
  const contentStatus =
    input.decision === 'changes_requested'
      ? 'changes_requested'
      : readiness.ready
        ? 'ready_to_schedule'
        : 'approved'

  const updated = await db
    .update(approvalRequest)
    .set({
      status: input.decision,
      decidedByUserId: input.actor.userId ?? null,
      reviewerName: input.actor.name,
      decidedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(approvalRequest.id, review.id),
        eq(approvalRequest.status, 'pending'),
      ),
    )
    .returning()
  if (updated.length === 0) {
    return { ok: false, error: 'This approval request was already handled.' }
  }

  await db
    .update(contentItem)
    .set({
      status: contentStatus,
      approvedVersion:
        input.decision === 'approved' ? review.versionNumber : null,
      updatedAt: now,
    })
    .where(eq(contentItem.id, review.contentItemId))

  if (comment) {
    await db.insert(approvalComment).values({
      id: crypto.randomUUID(),
      organizationId: review.organizationId,
      contentItemId: review.contentItemId,
      approvalRequestId: review.id,
      authorUserId: input.actor.userId ?? null,
      authorName: input.actor.name,
      authorRole: input.actor.role,
      body: comment,
    })
  }

  await recordActivity({
    organizationId: review.organizationId,
    clientId: review.clientId,
    contentItemId: review.contentItemId,
    actor: { id: input.actor.userId, name: input.actor.name },
    action:
      input.decision === 'approved'
        ? 'approval.approved'
        : 'approval.changes_requested',
    metadata: {
      approvalId: review.id,
      version: review.versionNumber,
      readyToSchedule: readiness.ready,
    },
  })

  const adminIds = await getOrganizationAdminIds(review.organizationId)
  await createNotifications({
    organizationId: review.organizationId,
    recipientUserIds: adminIds.filter((id) => id !== input.actor.userId),
    type: input.decision,
    title:
      input.decision === 'approved'
        ? `${review.clientName} approved content`
        : `${review.clientName} requested changes`,
    body: review.title,
    href: `/hub/content/${review.contentItemId}`,
  })

  return { ok: true, contentStatus, missing: readiness.missing }
}

export async function addApprovalComment(input: {
  approvalId: string
  body: string
  actor: {
    userId?: string | null
    name: string
    role: string
  }
}) {
  const review = await getApprovalReview(input.approvalId)
  if (!review) return { ok: false, error: 'Approval request not found.' }
  const body = input.body.trim()
  if (!body) return { ok: false, error: 'Write a comment first.' }
  if (body.length > 3000) return { ok: false, error: 'Keep comments under 3,000 characters.' }

  await db.insert(approvalComment).values({
    id: crypto.randomUUID(),
    organizationId: review.organizationId,
    contentItemId: review.contentItemId,
    approvalRequestId: review.id,
    authorUserId: input.actor.userId ?? null,
    authorName: input.actor.name,
    authorRole: input.actor.role,
    body,
  })

  await recordActivity({
    organizationId: review.organizationId,
    clientId: review.clientId,
    contentItemId: review.contentItemId,
    actor: { id: input.actor.userId, name: input.actor.name },
    action: 'approval.comment_added',
    metadata: { approvalId: review.id },
  })

  return { ok: true }
}
