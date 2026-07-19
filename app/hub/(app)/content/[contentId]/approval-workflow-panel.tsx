'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clipboard,
  Link2,
  LoaderCircle,
  Send,
  TriangleAlert,
} from 'lucide-react'
import {
  createAdditionalGuestLinkAction,
  createApprovalRequestAction,
} from '@/app/hub/(app)/approvals/actions'

type LatestApproval = {
  id: string
  status: string
  versionNumber: number
  requestedAt: Date
} | null

export function ApprovalWorkflowPanel({
  contentId,
  currentVersion,
  contentStatus,
  latestApproval,
  readiness,
}: {
  contentId: string
  currentVersion: number
  contentStatus: string
  latestApproval: LatestApproval
  readiness: { ready: boolean; missing: string[] }
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url)
    setShareUrl(url)
  }

  async function sendApproval() {
    setPending(true)
    setError('')
    const result = await createApprovalRequestAction(contentId, message)
    if (!result.ok) {
      setError(result.error ?? 'Could not create approval request.')
    } else if (result.token) {
      await copyLink(`${window.location.origin}/review/${result.token}`)
      router.refresh()
    }
    setPending(false)
  }

  async function makeGuestLink() {
    if (!latestApproval) return
    setPending(true)
    const result = await createAdditionalGuestLinkAction(latestApproval.id)
    if (!result.ok) {
      setError(result.error ?? 'Could not create review link.')
    } else if (result.token) {
      await copyLink(`${window.location.origin}/review/${result.token}`)
    }
    setPending(false)
  }

  const awaiting = latestApproval?.status === 'pending'

  return (
    <section className="approvalWorkflowPanel">
      <div className="approvalWorkflowHeading">
        <div>
          <p>Approval workflow</p>
          <span>Version {currentVersion}</span>
        </div>
        <span className={`contentStatus is-${contentStatus}`}>
          {contentStatus.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="approvalReadiness">
        {readiness.ready ? (
          <CheckCircle2 size={17} aria-hidden="true" />
        ) : (
          <TriangleAlert size={17} aria-hidden="true" />
        )}
        <div>
          <strong>
            {readiness.ready
              ? 'Complete and ready after approval'
              : 'Approval can continue, but scheduling is incomplete'}
          </strong>
          {!readiness.ready && (
            <small>Missing: {readiness.missing.join(', ')}</small>
          )}
        </div>
      </div>

      {awaiting ? (
        <div className="approvalPendingState">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>Waiting for review</strong>
            <span>Version {latestApproval.versionNumber} is with the client.</span>
          </div>
          <button type="button" onClick={makeGuestLink} disabled={pending}>
            <Link2 size={15} />
            New guest link
          </button>
        </div>
      ) : (
        <div className="approvalSendForm">
          <label>
            <span>Optional review note</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What should the client focus on?"
              rows={3}
            />
          </label>
          <button type="button" onClick={sendApproval} disabled={pending}>
            {pending ? (
              <LoaderCircle className="spinner" size={15} />
            ) : (
              <Send size={15} />
            )}
            Send for approval
          </button>
        </div>
      )}

      {shareUrl && (
        <div className="approvalShareLink">
          <input value={shareUrl} readOnly aria-label="Guest review link" />
          <button type="button" onClick={() => copyLink(shareUrl)}>
            <Clipboard size={15} /> Copy
          </button>
        </div>
      )}
      {error && <p className="workflowError">{error}</p>}
    </section>
  )
}
