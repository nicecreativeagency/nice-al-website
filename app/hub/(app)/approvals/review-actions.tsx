'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, MessageSquareText, X } from 'lucide-react'
import {
  addApprovalCommentAction,
  decideApprovalAction,
} from '@/app/hub/(app)/approvals/actions'

export function InternalReviewActions({
  approvalId,
  pending: isOpen,
}: {
  approvalId: string
  pending: boolean
}) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decide(decision: 'approved' | 'changes_requested') {
    setBusy(true)
    setError('')
    const result = await decideApprovalAction(approvalId, decision, comment)
    if (!result.ok) setError(result.error ?? 'The decision could not be saved.')
    else {
      setComment('')
      router.refresh()
    }
    setBusy(false)
  }

  async function addComment() {
    setBusy(true)
    const result = await addApprovalCommentAction(approvalId, comment)
    if (!result.ok) setError(result.error ?? 'The comment could not be saved.')
    else {
      setComment('')
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="reviewActionPanel">
      <label>
        <span>{isOpen ? 'Feedback or approval note' : 'Add to the discussion'}</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Write a clear comment…"
          rows={4}
        />
      </label>
      <div>
        <button type="button" onClick={addComment} disabled={busy || !comment.trim()}>
          <MessageSquareText size={15} /> Comment
        </button>
        {isOpen && (
          <>
            <button type="button" className="requestChanges" onClick={() => decide('changes_requested')} disabled={busy}>
              <X size={15} /> Request changes
            </button>
            <button type="button" className="approveContent" onClick={() => decide('approved')} disabled={busy}>
              {busy ? <LoaderCircle className="spinner" size={15} /> : <Check size={15} />}
              Approve
            </button>
          </>
        )}
      </div>
      {error && <p>{error}</p>}
    </div>
  )
}
