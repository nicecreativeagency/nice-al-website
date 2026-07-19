'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  Check,
  CheckCheck,
  LoaderCircle,
  MessageSquareText,
  X,
} from 'lucide-react'
import { MediaLightbox } from '@/app/hub/components/media-lightbox'
import { SOCIAL_PLATFORM_LABELS } from '@/lib/content-settings'
import type { SocialPlatform } from '@/lib/db/schema'
import {
  addCampaignReviewCommentAction,
  decideCampaignReviewBatchAction,
  decideCampaignReviewItemAction,
} from '@/app/review/campaign/[token]/actions'

export type CampaignReviewItemView = {
  approvalId: string
  title: string
  contentType: string
  status: string
  versionNumber: number
  caption: string
  scheduledDate: string | null
  scheduledTime: string | null
  timezone: string
  media: Array<{
    id: string
    resourceType: string
    secureUrl: string
  }>
  targets: Array<{
    platform: string
    caption: string | null
  }>
  comments: Array<{
    id: string
    authorName: string
    authorRole: string
    body: string
    createdAt: string
  }>
}

export function CampaignReviewClient({
  token,
  campaign,
  items,
}: {
  token: string
  campaign: {
    name: string
    description: string
    clientName: string
    expiresAt: string
  }
  items: CampaignReviewItemView[]
}) {
  const router = useRouter()
  const [reviewerName, setReviewerName] = useState('')
  const [batchComment, setBatchComment] = useState('')
  const [comments, setComments] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const pendingCount = items.filter((item) => item.status === 'pending').length
  const approvedCount = items.filter((item) => item.status === 'approved').length
  const changesCount = items.filter(
    (item) => item.status === 'changes_requested',
  ).length

  async function decideItem(
    approvalId: string,
    decision: 'approved' | 'changes_requested',
  ) {
    setBusy(`${approvalId}-${decision}`)
    setError('')
    const result = await decideCampaignReviewItemAction(
      token,
      approvalId,
      decision,
      reviewerName,
      comments[approvalId] ?? '',
    )
    if (!result.ok) {
      setError(result.error ?? 'The decision could not be saved.')
    } else {
      setComments((current) => ({ ...current, [approvalId]: '' }))
      router.refresh()
    }
    setBusy('')
  }

  async function addComment(approvalId: string) {
    setBusy(`${approvalId}-comment`)
    setError('')
    const result = await addCampaignReviewCommentAction(
      token,
      approvalId,
      reviewerName,
      comments[approvalId] ?? '',
    )
    if (!result.ok) {
      setError(result.error ?? 'The comment could not be saved.')
    } else {
      setComments((current) => ({ ...current, [approvalId]: '' }))
      router.refresh()
    }
    setBusy('')
  }

  async function decideBatch(decision: 'approved' | 'changes_requested') {
    setBusy(`batch-${decision}`)
    setError('')
    const result = await decideCampaignReviewBatchAction(
      token,
      decision,
      reviewerName,
      batchComment,
    )
    if (!result.ok) {
      setError(result.error ?? 'The campaign decision could not be saved.')
    } else {
      setBatchComment('')
      router.refresh()
    }
    setBusy('')
  }

  return (
    <main className="campaignGuestReview">
      <header className="campaignGuestTop">
        <span>NICE</span>
        <p>Secure campaign review</p>
      </header>

      <section className="campaignGuestHero">
        <small>{campaign.clientName}</small>
        <h1>{campaign.name}</h1>
        <p>
          {campaign.description ||
            'Review the complete campaign, leave feedback and approve content.'}
        </p>
        <div>
          <span><strong>{items.length}</strong> Content items</span>
          <span><strong>{approvedCount}</strong> Approved</span>
          <span><strong>{changesCount}</strong> Needs changes</span>
          <span><strong>{pendingCount}</strong> Waiting</span>
        </div>
      </section>

      <section className="campaignBatchReview">
        <div>
          <small>Reviewer details</small>
          <h2>Review the full campaign</h2>
          <p>Your name is used for every decision and comment below.</p>
        </div>
        <label>
          <span>Your name</span>
          <input
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder="Full name"
          />
        </label>
        <label>
          <span>Campaign-wide note</span>
          <textarea
            value={batchComment}
            onChange={(event) => setBatchComment(event.target.value)}
            rows={3}
            placeholder="Optional when approving, required when requesting changes"
          />
        </label>
        {pendingCount > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => decideBatch('changes_requested')}
              disabled={Boolean(busy)}
            >
              <X size={16} /> Request changes for all
            </button>
            <button
              className="approveAll"
              type="button"
              onClick={() => decideBatch('approved')}
              disabled={Boolean(busy)}
            >
              {busy.startsWith('batch-') ? (
                <LoaderCircle className="spinner" size={16} />
              ) : (
                <CheckCheck size={16} />
              )}
              Approve all remaining
            </button>
          </div>
        ) : (
          <div className="campaignReviewComplete">
            <CheckCheck size={18} /> Every item has a decision.
          </div>
        )}
        {error && <p className="campaignReviewError">{error}</p>}
      </section>

      <section className="campaignReviewItems">
        {items.map((item, index) => {
          const pending = item.status === 'pending'
          const itemComment = comments[item.approvalId] ?? ''
          return (
            <article className="campaignReviewCard" key={item.approvalId}>
              <header>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <small>
                    {item.contentType.replaceAll('_', ' ')} · Version{' '}
                    {item.versionNumber}
                  </small>
                  <h2>{item.title}</h2>
                </div>
                <em className={`approvalBadge is-${item.status}`}>
                  {item.status.replaceAll('_', ' ')}
                </em>
              </header>

              <div className="campaignReviewBody">
                <section>
                  <div className="campaignReviewMedia">
                    {item.media.length ? (
                      item.media.map((asset) =>
                        asset.resourceType === 'video' ? (
                          <video
                            key={asset.id}
                            src={asset.secureUrl}
                            controls
                          />
                        ) : (
                          <MediaLightbox
                            key={asset.id}
                            src={asset.secureUrl}
                            alt={item.title}
                          />
                        ),
                      )
                    ) : (
                      <div>No creative attached</div>
                    )}
                  </div>
                  <p className="campaignReviewSchedule">
                    <CalendarClock size={15} />
                    {item.scheduledDate ?? 'Date not set'}
                    {item.scheduledTime
                      ? ` · ${item.scheduledTime.slice(0, 5)}`
                      : ''}
                    <span>{item.timezone}</span>
                  </p>
                </section>

                <section className="campaignReviewCopy">
                  <div className="campaignPlatformLabels">
                    {item.targets.map((target) => (
                      <span key={target.platform}>
                        {SOCIAL_PLATFORM_LABELS[
                          target.platform as SocialPlatform
                        ] ?? target.platform}
                      </span>
                    ))}
                  </div>
                  <h3>Caption</h3>
                  <p>{item.caption || 'No caption.'}</p>
                  {item.targets.some((target) => target.caption) && (
                    <details>
                      <summary>Platform-specific captions</summary>
                      {item.targets.map((target) => (
                        <div key={target.platform}>
                          <strong>
                            {SOCIAL_PLATFORM_LABELS[
                              target.platform as SocialPlatform
                            ] ?? target.platform}
                          </strong>
                          <p>{target.caption || item.caption || 'No caption.'}</p>
                        </div>
                      ))}
                    </details>
                  )}
                </section>
              </div>

              <footer>
                <label>
                  <span>Comment or requested change</span>
                  <textarea
                    value={itemComment}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [item.approvalId]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Write clear feedback for NICE"
                  />
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => addComment(item.approvalId)}
                    disabled={Boolean(busy) || !itemComment.trim()}
                  >
                    <MessageSquareText size={15} /> Comment
                  </button>
                  {pending && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          decideItem(item.approvalId, 'changes_requested')
                        }
                        disabled={Boolean(busy)}
                      >
                        <X size={15} /> Request changes
                      </button>
                      <button
                        className="approveItem"
                        type="button"
                        onClick={() => decideItem(item.approvalId, 'approved')}
                        disabled={Boolean(busy)}
                      >
                        {busy === `${item.approvalId}-approved` ? (
                          <LoaderCircle className="spinner" size={15} />
                        ) : (
                          <Check size={15} />
                        )}
                        Approve
                      </button>
                    </>
                  )}
                </div>
                {item.comments.length > 0 && (
                  <section className="campaignItemDiscussion">
                    <h3>Discussion</h3>
                    {item.comments.map((comment) => (
                      <article key={comment.id}>
                        <div>
                          <strong>{comment.authorName}</strong>
                          <small>
                            {comment.authorRole.replaceAll('_', ' ')} ·{' '}
                            {new Date(comment.createdAt).toLocaleString('en-GB')}
                          </small>
                        </div>
                        <p>{comment.body}</p>
                      </article>
                    ))}
                  </section>
                )}
              </footer>
            </article>
          )
        })}
      </section>

      <footer className="campaignGuestFooter">
        Link expires {new Date(campaign.expiresAt).toLocaleDateString('en-GB')}
      </footer>
    </main>
  )
}
