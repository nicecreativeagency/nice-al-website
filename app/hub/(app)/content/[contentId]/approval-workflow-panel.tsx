'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarCheck2,
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
  const approved = [
    'approved',
    'ready_to_schedule',
    'scheduled',
    'published',
  ].includes(contentStatus)
  const stage = approved ? 3 : awaiting ? 2 : 1

  return (
    <section className="approvalWorkflowPanel">
      <div className="approvalWorkflowHeading">
        <div>
          <small>Client collaboration</small>
          <h2>Approval workflow</h2>
        </div>
        <strong>Version {currentVersion}</strong>
      </div>

      <ol className="approvalSteps">
        <li className={stage >= 1 ? 'active' : ''}>
          <span>{stage > 1 ? <CheckCircle2 size={17} /> : '1'}</span>
          <div><strong>Prepare</strong><small>Creative and copy</small></div>
        </li>
        <li className={stage >= 2 ? 'active' : ''}>
          <span>{stage > 2 ? <CheckCircle2 size={17} /> : '2'}</span>
          <div><strong>Client review</strong><small>Approve or comment</small></div>
        </li>
        <li className={stage >= 3 ? 'active' : ''}>
          <span>{stage > 3 ? <CheckCircle2 size={17} /> : '3'}</span>
          <div><strong>Ready</strong><small>Schedule content</small></div>
        </li>
      </ol>

      <div className={`approvalReadiness ${readiness.ready ? 'isReady' : ''}`}>
        <span>
          {readiness.ready ? <CalendarCheck2 size={20} /> : <TriangleAlert size={20} />}
        </span>
        <div>
          <strong>{readiness.ready ? 'Everything required is complete' : 'Scheduling details need attention'}</strong>
          <small>
            {readiness.ready
              ? 'Once approved, this content can move directly to scheduling.'
              : readiness.missing.join(' · ')}
          </small>
        </div>
      </div>

      {awaiting ? (
        <div className="approvalPendingState">
          <span><CheckCircle2 size={22} aria-hidden="true" /></span>
          <div>
            <small>Currently with client</small>
            <strong>Version {latestApproval.versionNumber} is waiting for a decision</strong>
            <p>The review stays linked to this exact version.</p>
          </div>
          <button type="button" onClick={makeGuestLink} disabled={pending}>
            <Link2 size={15} />
            Create another link
          </button>
        </div>
      ) : (
        <div className="approvalSendForm">
          <div>
            <small>Next action</small>
            <h3>Send version {currentVersion} to the client</h3>
            <p>They can approve it or request changes from their account or a guest link.</p>
          </div>
          <label>
            <span>Review note <em>Optional</em></span>
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
            <ArrowRight size={16} />
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
