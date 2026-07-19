import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getApprovalReview } from '@/lib/approval-workflow'
import { SOCIAL_PLATFORM_LABELS } from '@/lib/content-settings'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  approvalComment,
  contentMedia,
  contentPlatformTarget,
  mediaAsset,
  type SocialPlatform,
} from '@/lib/db/schema'
import { InternalReviewActions } from '@/app/hub/(app)/approvals/review-actions'

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ approvalId: string }>
}) {
  const viewer = await requireViewer()
  const { approvalId } = await params
  const review = await getApprovalReview(approvalId)
  if (
    !review ||
    review.organizationId !== viewer.organization.id ||
    (viewer.role === 'client' &&
      !viewer.clients.some((item) => item.id === review.clientId))
  ) {
    notFound()
  }

  const liveTargets = await db
    .select({
      platform: contentPlatformTarget.platform,
      caption: contentPlatformTarget.caption,
    })
    .from(contentPlatformTarget)
    .where(eq(contentPlatformTarget.contentItemId, review.contentItemId))
  const liveMedia = await db
    .select({
      id: mediaAsset.id,
      resourceType: mediaAsset.resourceType,
      secureUrl: mediaAsset.secureUrl,
      name: mediaAsset.originalFilename,
    })
    .from(contentMedia)
    .innerJoin(mediaAsset, eq(mediaAsset.id, contentMedia.mediaAssetId))
    .where(eq(contentMedia.contentItemId, review.contentItemId))
    .orderBy(asc(contentMedia.sortOrder))
  const targets = review.platformSnapshot?.length
    ? review.platformSnapshot
    : liveTargets
  const media = review.mediaSnapshot?.length
    ? review.mediaSnapshot.map((asset) => ({
        id: asset.mediaAssetId,
        resourceType: asset.resourceType,
        secureUrl: asset.secureUrl,
        name: null,
      }))
    : liveMedia
  const comments = await db
    .select()
    .from(approvalComment)
    .where(eq(approvalComment.approvalRequestId, review.id))
    .orderBy(asc(approvalComment.createdAt))

  return (
    <div className="hubPage reviewWorkspace">
      <Link className="clientBackLink" href="/hub/approvals"><ArrowLeft size={15} />All approvals</Link>
      <header className="reviewHeader">
        <div><small>{review.clientName} · Version {review.versionNumber}</small><h1>{review.versionTitle ?? review.title}</h1><p>{review.message || 'Content ready for review.'}</p></div>
        <span className={`approvalBadge is-${review.approvalStatus}`}>{review.approvalStatus.replaceAll('_', ' ')}</span>
      </header>
      <p className="reviewSchedule">
        Planned: {review.scheduledDate ?? 'Date not set'}
        {review.scheduledTime ? ` · ${review.scheduledTime.slice(0, 5)}` : ''}
        {' · '}{review.timezone}
      </p>
      <div className="reviewGrid">
        <main>
          <div className="reviewMedia">
            {media.map((asset) =>
              asset.resourceType === 'video' ? (
                <video key={asset.id} src={asset.secureUrl} controls />
              ) : (
                <img key={asset.id} src={asset.secureUrl} alt={asset.name ?? 'Creative'} />
              ),
            )}
          </div>
          <section className="reviewCopy">
            <h2>Base caption</h2><p>{review.versionCaption || review.caption || 'No base caption.'}</p>
            {targets.map((target) => (
              <div key={target.platform}>
                <strong>{SOCIAL_PLATFORM_LABELS[target.platform as SocialPlatform]}</strong>
                <p>{target.caption || review.versionCaption || review.caption || 'No caption.'}</p>
              </div>
            ))}
          </section>
        </main>
        <aside>
          <InternalReviewActions approvalId={review.id} pending={review.approvalStatus === 'pending'} />
          <section className="commentTimeline">
            <h2>Discussion</h2>
            {comments.length === 0 ? <p>No comments yet.</p> : comments.map((comment) => (
              <article key={comment.id}>
                <div><strong>{comment.authorName}</strong><small>{comment.authorRole.replaceAll('_', ' ')}</small><time>{comment.createdAt.toLocaleString('en-GB')}</time></div>
                <p>{comment.body}</p>
              </article>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
