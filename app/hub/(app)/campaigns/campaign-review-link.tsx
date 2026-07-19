'use client'

import { useState } from 'react'
import { Check, Clipboard, Link2, LoaderCircle } from 'lucide-react'
import { createCampaignReviewLinkAction } from '@/app/hub/(app)/campaigns/actions'

export function CampaignReviewLink({ campaignId }: { campaignId: string }) {
  const [busy, setBusy] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [itemCount, setItemCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function createLink() {
    setBusy(true)
    setError('')
    setCopied(false)
    const result = await createCampaignReviewLinkAction(campaignId)
    if (!result.ok || !result.token) {
      setError(result.error ?? 'The campaign review link could not be created.')
    } else {
      const url = `${window.location.origin}/review/campaign/${result.token}`
      setShareUrl(url)
      setItemCount(result.itemCount ?? 0)
      await navigator.clipboard.writeText(url)
      setCopied(true)
    }
    setBusy(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
  }

  return (
    <div className="campaignReviewShare">
      <button type="button" onClick={createLink} disabled={busy}>
        {busy ? (
          <LoaderCircle className="spinner" size={15} />
        ) : (
          <Link2 size={15} />
        )}
        Share campaign review
      </button>
      {shareUrl && (
        <div>
          <p>
            <Check size={14} />
            One secure link for {itemCount} content items
          </p>
          <span>
            <input readOnly value={shareUrl} aria-label="Campaign review link" />
            <button type="button" onClick={copyLink}>
              <Clipboard size={14} /> {copied ? 'Copied' : 'Copy'}
            </button>
          </span>
        </div>
      )}
      {error && <small>{error}</small>}
    </div>
  )
}
