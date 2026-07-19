'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createApprovalRequestAction } from '@/app/hub/(app)/approvals/actions'
import { recordActivity } from '@/lib/activity'
import { createReviewToken, hashReviewToken } from '@/lib/approval-workflow'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  approvalRequest,
  campaign,
  campaignReviewItem,
  campaignReviewLink,
  client,
  contentItem,
} from '@/lib/db/schema'

const campaignSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Choose a client.'),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(3000),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be after the start date.',
      })
    }
  })

export type CampaignFormState = {
  error?: string
  fields?: Record<string, string[]>
}

async function getOwnedClient(clientId: string, organizationId: string) {
  const [ownedClient] = await db
    .select({ id: client.id })
    .from(client)
    .where(
      and(
        eq(client.id, clientId),
        eq(client.organizationId, organizationId),
      ),
    )
    .limit(1)
  return ownedClient
}

export async function createCampaignAction(
  _state: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const viewer = await requireAdmin()
  const parsed = campaignSchema.safeParse({
    clientId: formData.get('clientId'),
    name: formData.get('name'),
    description: formData.get('description'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Check the campaign information.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const ownedClient = await getOwnedClient(
    parsed.data.clientId,
    viewer.organization.id,
  )
  if (!ownedClient) return { error: 'Choose a valid client.' }

  const campaignId = crypto.randomUUID()
  await db.insert(campaign).values({
    id: campaignId,
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    createdByUserId: viewer.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  })

  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'campaign.created',
    metadata: { campaignId, campaignName: parsed.data.name },
  })

  revalidatePath('/hub/campaigns')
  redirect(`/hub/campaigns/${campaignId}?created=1`)
}

export async function updateCampaignAction(
  campaignId: string,
  _state: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const viewer = await requireAdmin()
  const parsed = campaignSchema.safeParse({
    clientId: formData.get('clientId'),
    name: formData.get('name'),
    description: formData.get('description'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Check the campaign information.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const ownedClient = await getOwnedClient(
    parsed.data.clientId,
    viewer.organization.id,
  )
  if (!ownedClient) return { error: 'Choose a valid client.' }

  const updated = await db
    .update(campaign)
    .set({
      clientId: ownedClient.id,
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(campaign.id, campaignId),
        eq(campaign.organizationId, viewer.organization.id),
      ),
    )
    .returning()

  if (!updated[0]) return { error: 'Campaign not found.' }

  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'campaign.updated',
    metadata: { campaignId, campaignName: parsed.data.name },
  })

  revalidatePath('/hub/campaigns')
  revalidatePath(`/hub/campaigns/${campaignId}`)
  redirect(`/hub/campaigns/${campaignId}?saved=1`)
}

export async function sendCampaignForApprovalAction(campaignId: string) {
  const viewer = await requireAdmin()
  const [ownedCampaign] = await db
    .select({ id: campaign.id })
    .from(campaign)
    .where(
      and(
        eq(campaign.id, campaignId),
        eq(campaign.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!ownedCampaign) redirect('/hub/campaigns')

  const items = await db
    .select({ id: contentItem.id, status: contentItem.status })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.organizationId, viewer.organization.id),
        eq(contentItem.campaignId, ownedCampaign.id),
      ),
    )
  const reviewable = items.filter(
    (item) => !['archived', 'published'].includes(item.status),
  )
  let completed = 0
  for (const item of reviewable) {
    const result = await createApprovalRequestAction(item.id, '')
    if (result.ok) completed += 1
  }

  revalidatePath(`/hub/campaigns/${campaignId}`)
  redirect(`/hub/campaigns/${campaignId}?approvals=${completed}`)
}

export async function createCampaignReviewLinkAction(campaignId: string) {
  const viewer = await requireAdmin()
  const [ownedCampaign] = await db
    .select({
      id: campaign.id,
      clientId: campaign.clientId,
      name: campaign.name,
    })
    .from(campaign)
    .where(
      and(
        eq(campaign.id, campaignId),
        eq(campaign.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!ownedCampaign) {
    return { ok: false, error: 'Campaign not found.' }
  }

  const items = await db
    .select({
      id: contentItem.id,
      status: contentItem.status,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.organizationId, viewer.organization.id),
        eq(contentItem.campaignId, ownedCampaign.id),
      ),
    )
    .orderBy(contentItem.scheduledDate, contentItem.createdAt)
  const reviewable = items.filter(
    (item) => !['archived', 'published'].includes(item.status),
  )
  if (!reviewable.length) {
    return { ok: false, error: 'Add reviewable content to this campaign first.' }
  }

  const existingApprovals = await db
    .select({
      id: approvalRequest.id,
      contentItemId: approvalRequest.contentItemId,
    })
    .from(approvalRequest)
    .innerJoin(contentItem, eq(contentItem.id, approvalRequest.contentItemId))
    .where(
      and(
        eq(approvalRequest.organizationId, viewer.organization.id),
        eq(approvalRequest.status, 'pending'),
        eq(contentItem.campaignId, ownedCampaign.id),
      ),
    )
  const existingByContent = new Map(
    existingApprovals.map((approval) => [
      approval.contentItemId,
      approval.id,
    ]),
  )
  const approvalIds: string[] = []
  for (const item of reviewable) {
    const existingApprovalId = existingByContent.get(item.id)
    if (existingApprovalId) {
      approvalIds.push(existingApprovalId)
      continue
    }
    const created = await createApprovalRequestAction(item.id, '')
    if (created.ok && created.approvalId) {
      approvalIds.push(created.approvalId)
    }
  }
  if (!approvalIds.length) {
    return {
      ok: false,
      error: 'No approval requests could be prepared for this campaign.',
    }
  }

  const token = createReviewToken()
  const linkId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await db
    .update(campaignReviewLink)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(campaignReviewLink.campaignId, ownedCampaign.id),
        eq(campaignReviewLink.organizationId, viewer.organization.id),
        isNull(campaignReviewLink.revokedAt),
      ),
    )
  await db.insert(campaignReviewLink).values({
    id: linkId,
    organizationId: viewer.organization.id,
    campaignId: ownedCampaign.id,
    tokenHash: hashReviewToken(token),
    createdByUserId: viewer.user.id,
    expiresAt,
  })
  await db.insert(campaignReviewItem).values(
    approvalIds.map((approvalRequestId, index) => ({
      id: crypto.randomUUID(),
      campaignReviewLinkId: linkId,
      approvalRequestId,
      sortOrder: index,
    })),
  )
  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: ownedCampaign.clientId,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'campaign.review_link_created',
    metadata: {
      campaignId: ownedCampaign.id,
      campaignName: ownedCampaign.name,
      itemCount: approvalIds.length,
    },
  })

  revalidatePath(`/hub/campaigns/${campaignId}`)
  return {
    ok: true,
    token,
    itemCount: approvalIds.length,
    expiresAt: expiresAt.toISOString(),
  }
}
