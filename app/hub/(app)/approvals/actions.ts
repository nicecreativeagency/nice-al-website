'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  createNotifications,
  getClientReviewerIds,
  recordActivity,
} from '@/lib/activity'
import {
  addApprovalComment,
  createReviewToken,
  decideApproval,
  getApprovalReview,
  hashReviewToken,
} from '@/lib/approval-workflow'
import { requireAdmin, requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  approvalLink,
  approvalRequest,
  client,
  contentItem,
} from '@/lib/db/schema'

function canAccessClient(
  viewer: Awaited<ReturnType<typeof requireViewer>>,
  clientId: string,
) {
  return (
    viewer.role !== 'client' ||
    viewer.clients.some((assignedClient) => assignedClient.id === clientId)
  )
}

export async function createApprovalRequestAction(
  contentId: string,
  message: string,
) {
  const viewer = await requireAdmin()
  const [content] = await db
    .select({
      id: contentItem.id,
      title: contentItem.title,
      clientId: contentItem.clientId,
      clientName: client.name,
      currentVersion: contentItem.currentVersion,
    })
    .from(contentItem)
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!content) return { ok: false, error: 'Content item not found.' }

  await db
    .update(approvalRequest)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(approvalRequest.contentItemId, content.id),
        eq(approvalRequest.status, 'pending'),
      ),
    )

  const approvalId = crypto.randomUUID()
  const token = createReviewToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await db.insert(approvalRequest).values({
    id: approvalId,
    organizationId: viewer.organization.id,
    contentItemId: content.id,
    requestedByUserId: viewer.user.id,
    versionNumber: content.currentVersion,
    status: 'pending',
    message: message.trim().slice(0, 2000),
  })
  await db.insert(approvalLink).values({
    id: crypto.randomUUID(),
    organizationId: viewer.organization.id,
    approvalRequestId: approvalId,
    tokenHash: hashReviewToken(token),
    createdByUserId: viewer.user.id,
    expiresAt,
  })
  await db
    .update(contentItem)
    .set({ status: 'waiting_approval', updatedAt: new Date() })
    .where(eq(contentItem.id, content.id))

  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: content.clientId,
    contentItemId: content.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'approval.requested',
    metadata: { approvalId, version: content.currentVersion },
  })

  const reviewerIds = await getClientReviewerIds(content.clientId)
  await createNotifications({
    organizationId: viewer.organization.id,
    recipientUserIds: reviewerIds,
    type: 'approval_requested',
    title: 'New content needs your approval',
    body: content.title,
    href: `/hub/approvals/${approvalId}`,
  })

  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${content.id}`)
  revalidatePath('/hub/approvals')
  return { ok: true, approvalId, token, expiresAt: expiresAt.toISOString() }
}

export async function createAdditionalGuestLinkAction(approvalId: string) {
  const viewer = await requireAdmin()
  const review = await getApprovalReview(approvalId)
  if (
    !review ||
    review.organizationId !== viewer.organization.id ||
    review.approvalStatus !== 'pending'
  ) {
    return { ok: false, error: 'No open approval request was found.' }
  }

  const token = createReviewToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await db.insert(approvalLink).values({
    id: crypto.randomUUID(),
    organizationId: viewer.organization.id,
    approvalRequestId: review.id,
    tokenHash: hashReviewToken(token),
    createdByUserId: viewer.user.id,
    expiresAt,
  })
  return { ok: true, token, expiresAt: expiresAt.toISOString() }
}

export async function decideApprovalAction(
  approvalId: string,
  decision: 'approved' | 'changes_requested',
  comment: string,
) {
  const viewer = await requireViewer()
  const review = await getApprovalReview(approvalId)
  if (
    !review ||
    review.organizationId !== viewer.organization.id ||
    !canAccessClient(viewer, review.clientId)
  ) {
    return { ok: false, error: 'Approval request not found.' }
  }

  const result = await decideApproval({
    approvalId,
    decision,
    comment,
    actor: {
      userId: viewer.user.id,
      name: viewer.user.name,
      role: viewer.role,
    },
  })
  revalidatePath('/hub/approvals')
  revalidatePath(`/hub/approvals/${approvalId}`)
  revalidatePath(`/hub/content/${review.contentItemId}`)
  revalidatePath('/hub/dashboard')
  return result
}

export async function addApprovalCommentAction(
  approvalId: string,
  body: string,
) {
  const viewer = await requireViewer()
  const review = await getApprovalReview(approvalId)
  if (
    !review ||
    review.organizationId !== viewer.organization.id ||
    !canAccessClient(viewer, review.clientId)
  ) {
    return { ok: false, error: 'Approval request not found.' }
  }

  const result = await addApprovalComment({
    approvalId,
    body,
    actor: {
      userId: viewer.user.id,
      name: viewer.user.name,
      role: viewer.role,
    },
  })
  revalidatePath(`/hub/approvals/${approvalId}`)
  return result
}

export async function getLatestApprovalForContent(contentId: string) {
  const viewer = await requireAdmin()
  const [row] = await db
    .select({
      id: approvalRequest.id,
      status: approvalRequest.status,
      versionNumber: approvalRequest.versionNumber,
      requestedAt: approvalRequest.requestedAt,
    })
    .from(approvalRequest)
    .innerJoin(contentItem, eq(contentItem.id, approvalRequest.contentItemId))
    .where(
      and(
        eq(approvalRequest.contentItemId, contentId),
        eq(approvalRequest.organizationId, viewer.organization.id),
      ),
    )
    .orderBy(desc(approvalRequest.requestedAt))
    .limit(1)
  return row
}
