'use server'

import { and, eq, gt, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  addApprovalComment,
  decideApproval,
  hashReviewToken,
} from '@/lib/approval-workflow'
import { db } from '@/lib/db'
import { approvalLink, approvalRequest } from '@/lib/db/schema'

async function getOpenGuestApproval(token: string) {
  const tokenHash = hashReviewToken(token)
  const [link] = await db
    .select({
      id: approvalLink.id,
      approvalId: approvalRequest.id,
      status: approvalRequest.status,
    })
    .from(approvalLink)
    .innerJoin(
      approvalRequest,
      eq(approvalRequest.id, approvalLink.approvalRequestId),
    )
    .where(
      and(
        eq(approvalLink.tokenHash, tokenHash),
        isNull(approvalLink.revokedAt),
        gt(approvalLink.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return link
}

export async function decideGuestApprovalAction(
  token: string,
  decision: 'approved' | 'changes_requested',
  reviewerName: string,
  comment: string,
) {
  const link = await getOpenGuestApproval(token)
  if (!link) return { ok: false, error: 'This review link is unavailable.' }
  const name = reviewerName.trim().slice(0, 100)
  if (!name) return { ok: false, error: 'Enter your name.' }

  const result = await decideApproval({
    approvalId: link.approvalId,
    decision,
    comment,
    actor: { name, role: 'guest_reviewer' },
  })
  revalidatePath(`/review/${token}`)
  return result
}

export async function addGuestCommentAction(
  token: string,
  reviewerName: string,
  body: string,
) {
  const link = await getOpenGuestApproval(token)
  if (!link) return { ok: false, error: 'This review link is unavailable.' }
  const name = reviewerName.trim().slice(0, 100)
  if (!name) return { ok: false, error: 'Enter your name.' }

  const result = await addApprovalComment({
    approvalId: link.approvalId,
    body,
    actor: { name, role: 'guest_reviewer' },
  })
  revalidatePath(`/review/${token}`)
  return result
}
