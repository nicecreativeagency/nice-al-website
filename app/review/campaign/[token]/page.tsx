import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { getApprovalReview, hashReviewToken } from '@/lib/approval-workflow'
import { db } from '@/lib/db'
import {
  approvalComment,
  approvalRequest,
  campaign,
  campaignReviewItem,
  campaignReviewLink,
  client,
} from '@/lib/db/schema'
import {
  CampaignReviewClient,
  type CampaignReviewItemView,
} from '@/app/review/campaign/[token]/campaign-review-client'

export default async function CampaignGuestReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [shared] = await db
    .select({
      id: campaignReviewLink.id,
      expiresAt: campaignReviewLink.expiresAt,
      campaignName: campaign.name,
      campaignDescription: campaign.description,
      clientName: client.name,
    })
    .from(campaignReviewLink)
    .innerJoin(campaign, eq(campaign.id, campaignReviewLink.campaignId))
    .innerJoin(client, eq(client.id, campaign.clientId))
    .where(
      and(
        eq(campaignReviewLink.tokenHash, hashReviewToken(token)),
        isNull(campaignReviewLink.revokedAt),
        gt(campaignReviewLink.expiresAt, new Date()),
      ),
    )
    .limit(1)
  if (!shared) notFound()

  await db
    .update(campaignReviewLink)
    .set({ lastAccessedAt: new Date() })
    .where(eq(campaignReviewLink.id, shared.id))

  const linkedApprovals = await db
    .select({
      id: approvalRequest.id,
      sortOrder: campaignReviewItem.sortOrder,
    })
    .from(campaignReviewItem)
    .innerJoin(
      approvalRequest,
      eq(approvalRequest.id, campaignReviewItem.approvalRequestId),
    )
    .where(eq(campaignReviewItem.campaignReviewLinkId, shared.id))
    .orderBy(asc(campaignReviewItem.sortOrder))
  const approvalIds = linkedApprovals.map((approval) => approval.id)
  const commentRows = approvalIds.length
    ? await db
        .select()
        .from(approvalComment)
        .where(inArray(approvalComment.approvalRequestId, approvalIds))
        .orderBy(asc(approvalComment.createdAt))
    : []
  const commentsByApproval = commentRows.reduce((map, comment) => {
    if (!comment.approvalRequestId) return map
    const existing = map.get(comment.approvalRequestId) ?? []
    existing.push(comment)
    map.set(comment.approvalRequestId, existing)
    return map
  }, new Map<string, typeof commentRows>())

  const items: CampaignReviewItemView[] = []
  for (const linkedApproval of linkedApprovals) {
    const review = await getApprovalReview(linkedApproval.id)
    if (!review) continue
    items.push({
      approvalId: review.id,
      title: review.versionTitle ?? review.title,
      contentType: review.contentType,
      status: review.approvalStatus,
      versionNumber: review.versionNumber,
      caption: review.versionCaption || review.caption,
      scheduledDate: review.scheduledDate,
      scheduledTime: review.scheduledTime,
      timezone: review.timezone,
      media:
        review.mediaSnapshot?.map((asset) => ({
          id: asset.mediaAssetId,
          resourceType: asset.resourceType,
          secureUrl: asset.secureUrl,
        })) ?? [],
      targets:
        review.platformSnapshot?.map((target) => ({
          platform: target.platform,
          caption: target.caption,
        })) ?? [],
      comments: (commentsByApproval.get(review.id) ?? []).map((comment) => ({
        id: comment.id,
        authorName: comment.authorName,
        authorRole: comment.authorRole,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
    })
  }

  return (
    <CampaignReviewClient
      token={token}
      campaign={{
        name: shared.campaignName,
        description: shared.campaignDescription,
        clientName: shared.clientName,
        expiresAt: shared.expiresAt.toISOString(),
      }}
      items={items}
    />
  )
}
