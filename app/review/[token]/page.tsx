import { and, asc, eq, gt, isNull } from 'drizzle-orm'
import { Link2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getApprovalReview, hashReviewToken } from '@/lib/approval-workflow'
import { SOCIAL_PLATFORM_LABELS } from '@/lib/content-settings'
import { db } from '@/lib/db'
import {
  approvalComment,
  approvalLink,
  contentMedia,
  contentPlatformTarget,
  mediaAsset,
  type SocialPlatform,
} from '@/lib/db/schema'
import { GuestReviewActions } from '@/app/review/[token]/guest-review-actions'

export default async function GuestReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [link] = await db
    .select({
      id: approvalLink.id,
      approvalId: approvalLink.approvalRequestId,
    })
    .from(approvalLink)
    .where(
      and(
        eq(approvalLink.tokenHash, hashReviewToken(token)),
        isNull(approvalLink.revokedAt),
        gt(approvalLink.expiresAt, new Date()),
      ),
    )
    .limit(1)
  if (!link) notFound()

  await db
    .update(approvalLink)
    .set({ lastAccessedAt: new Date() })
    .where(eq(approvalLink.id, link.id))

  const review = await getApprovalReview(link.approvalId)
  if (!review) notFound()
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
    <main className="guestReviewPage">
      <header className="guestReviewTop"><span>NICE</span><p><Link2 size={14} />Secure content review</p></header>
      <section className="guestReviewIntro">
        <small>{review.clientName} · Version {review.versionNumber}</small>
        <h1>{review.versionTitle ?? review.title}</h1>
        <p>{review.message || 'NICE shared this content for your review.'}</p>
        <span className={`approvalBadge is-${review.approvalStatus}`}>{review.approvalStatus.replaceAll('_', ' ')}</span>
      </section>
      <div className="reviewGrid">
        <main>
          <div className="reviewMedia">
            {media.map((asset) => asset.resourceType === 'video'
              ? <video key={asset.id} src={asset.secureUrl} controls />
              : <img key={asset.id} src={asset.secureUrl} alt={asset.name ?? 'Creative'} />)}
          </div>
          <section className="reviewCopy">
            <h2>Caption</h2><p>{review.versionCaption || review.caption || 'No base caption.'}</p>
            {targets.map((target) => (
              <div key={target.platform}>
                <strong>{SOCIAL_PLATFORM_LABELS[target.platform as SocialPlatform]}</strong>
                <p>{target.caption || review.versionCaption || review.caption || 'No caption.'}</p>
              </div>
            ))}
          </section>
        </main>
        <aside>
          <GuestReviewActions token={token} pending={review.approvalStatus === 'pending'} />
          <section className="commentTimeline">
            <h2>Discussion</h2>
            {comments.length === 0 ? <p>No comments yet.</p> : comments.map((comment) => (
              <article key={comment.id}><div><strong>{comment.authorName}</strong><small>{comment.authorRole.replaceAll('_', ' ')}</small><time>{comment.createdAt.toLocaleString('en-GB')}</time></div><p>{comment.body}</p></article>
            ))}
          </section>
        </aside>
      </div>
    </main>
  )
}
