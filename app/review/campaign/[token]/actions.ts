'use server'

import { and, eq, gt, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  addApprovalComment,
  decideApproval,
  hashReviewToken,
} from '@/lib/approval-workflow'
import { db } from '@/lib/db'
import {
  approvalRequest,
  campaignReviewItem,
  campaignReviewLink,
} from '@/lib/db/schema'

async function getCampaignReviewAccess(token: string) {
  const [link] = await db
    .select({
      id: campaignReviewLink.id,
      organizationId: campaignReviewLink.organizationId,
    })
    .from(campaignReviewLink)
    .where(
      and(
        eq(campaignReviewLink.tokenHash, hashReviewToken(token)),
        isNull(campaignReviewLink.revokedAt),
        gt(campaignReviewLink.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return link
}

async function getCampaignApproval(
  campaignReviewLinkId: string,
  approvalId: string,
) {
  const [approval] = await db
    .select({
      id: approvalRequest.id,
      status: approvalRequest.status,
    })
    .from(campaignReviewItem)
    .innerJoin(
      approvalRequest,
      eq(approvalRequest.id, campaignReviewItem.approvalRequestId),
    )
    .where(
      and(
        eq(campaignReviewItem.campaignReviewLinkId, campaignReviewLinkId),
        eq(approvalRequest.id, approvalId),
      ),
    )
    .limit(1)
  return approval
}

function cleanReviewerName(reviewerName: string) {
  return reviewerName.trim().slice(0, 100)
}

export async function decideCampaignReviewItemAction(
  token: string,
  approvalId: string,
  decision: 'approved' | 'changes_requested',
  reviewerName: string,
  comment: string,
) {
  const link = await getCampaignReviewAccess(token)
  if (!link) return { ok: false, error: 'This campaign link is unavailable.' }
  const approval = await getCampaignApproval(link.id, approvalId)
  if (!approval) return { ok: false, error: 'This content is not in the shared campaign.' }
  const name = cleanReviewerName(reviewerName)
  if (!name) return { ok: false, error: 'Enter your name first.' }

  const result = await decideApproval({
    approvalId: approval.id,
    decision,
    comment,
    actor: { name, role: 'guest_reviewer' },
  })
  revalidatePath(`/review/campaign/${token}`)
  return result
}

export async function addCampaignReviewCommentAction(
  token: string,
  approvalId: string,
  reviewerName: string,
  comment: string,
) {
  const link = await getCampaignReviewAccess(token)
  if (!link) return { ok: false, error: 'This campaign link is unavailable.' }
  const approval = await getCampaignApproval(link.id, approvalId)
  if (!approval) return { ok: false, error: 'This content is not in the shared campaign.' }
  const name = cleanReviewerName(reviewerName)
  if (!name) return { ok: false, error: 'Enter your name first.' }

  const result = await addApprovalComment({
    approvalId: approval.id,
    body: comment,
    actor: { name, role: 'guest_reviewer' },
  })
  revalidatePath(`/review/campaign/${token}`)
  return result
}

export async function decideCampaignReviewBatchAction(
  token: string,
  decision: 'approved' | 'changes_requested',
  reviewerName: string,
  comment: string,
) {
  const link = await getCampaignReviewAccess(token)
  if (!link) return { ok: false, error: 'This campaign link is unavailable.' }
  const name = cleanReviewerName(reviewerName)
  if (!name) return { ok: false, error: 'Enter your name first.' }
  if (decision === 'changes_requested' && !comment.trim()) {
    return {
      ok: false,
      error: 'Add one clear comment before requesting changes for all items.',
    }
  }

  const approvals = await db
    .select({
      id: approvalRequest.id,
      status: approvalRequest.status,
    })
    .from(campaignReviewItem)
    .innerJoin(
      approvalRequest,
      eq(approvalRequest.id, campaignReviewItem.approvalRequestId),
    )
    .where(eq(campaignReviewItem.campaignReviewLinkId, link.id))
  const pending = approvals.filter((approval) => approval.status === 'pending')
  let completed = 0
  for (const approval of pending) {
    const result = await decideApproval({
      approvalId: approval.id,
      decision,
      comment,
      actor: { name, role: 'guest_reviewer' },
    })
    if (result.ok) completed += 1
  }

  revalidatePath(`/review/campaign/${token}`)
  return { ok: true, completed }
}
