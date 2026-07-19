'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, MessageSquareText, X } from 'lucide-react'
import {
  addGuestCommentAction,
  decideGuestApprovalAction,
} from '@/app/review/[token]/actions'

export function GuestReviewActions({
  token,
  pending,
}: {
  token: string
  pending: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decide(decision: 'approved' | 'changes_requested') {
    setBusy(true)
    setError('')
    const result = await decideGuestApprovalAction(
      token,
      decision,
      name,
      comment,
    )
    if (!result.ok) setError(result.error ?? 'The decision could not be saved.')
    else {
      setComment('')
      router.refresh()
    }
    setBusy(false)
  }

  async function commentOnly() {
    setBusy(true)
    const result = await addGuestCommentAction(token, name, comment)
    if (!result.ok) setError(result.error ?? 'The comment could not be saved.')
    else {
      setComment('')
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="reviewActionPanel">
      <label><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /></label>
      <label><span>Feedback</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} placeholder="Add a note or explain requested changes…" /></label>
      <div>
        <button type="button" onClick={commentOnly} disabled={busy || !comment.trim()}><MessageSquareText size={15} />Comment</button>
        {pending && (
          <>
            <button type="button" className="requestChanges" onClick={() => decide('changes_requested')} disabled={busy}><X size={15} />Request changes</button>
            <button type="button" className="approveContent" onClick={() => decide('approved')} disabled={busy}>
              {busy ? <LoaderCircle className="spinner" size={15} /> : <Check size={15} />}Approve
            </button>
          </>
        )}
      </div>
      {error && <p>{error}</p>}
    </div>
  )
}
