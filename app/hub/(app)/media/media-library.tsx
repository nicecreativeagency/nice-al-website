'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, FileImage, Trash2, X } from 'lucide-react'
import { deleteUnusedMediaAction } from '@/app/hub/(app)/media/actions'

export type MediaLibraryAsset = {
  id: string
  url: string
  resourceType: string
  filename: string | null
  format: string | null
  bytes: number | null
  width: number | null
  height: number | null
  createdAt: string
  clientName: string
  clientColor: string
  usages: Array<{ id: string; title: string }>
}

function formatBytes(bytes: number | null) {
  if (!bytes) return 'Unknown size'
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaLibrary({ assets }: { assets: MediaLibraryAsset[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<MediaLibraryAsset | null>(null)
  const [copied, setCopied] = useState(false)

  function inspect(asset: MediaLibraryAsset) {
    setSelected(asset)
    setCopied(false)
    dialogRef.current?.showModal()
  }

  async function copyUrl() {
    if (!selected) return
    await navigator.clipboard.writeText(selected.url)
    setCopied(true)
  }

  return (
    <>
      <section className="mediaLibraryGrid">
        {assets.map((asset) => (
          <button type="button" key={asset.id} onClick={() => inspect(asset)}>
            <div>
              {asset.resourceType === 'image' ? (
                <img src={asset.url} alt={asset.filename ?? ''} />
              ) : (
                <video src={asset.url} muted preload="metadata" />
              )}
            </div>
            <span>
              <i style={{ backgroundColor: asset.clientColor }} />
              {asset.clientName}
            </span>
            <strong>{asset.filename ?? `Untitled.${asset.format ?? 'file'}`}</strong>
            <small>{asset.usages.length} use{asset.usages.length === 1 ? '' : 's'} · {formatBytes(asset.bytes)}</small>
          </button>
        ))}
      </section>

      <dialog
        ref={dialogRef}
        className="mediaInspectorDialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        {selected ? (
          <div className="mediaInspector">
            <button
              className="mediaInspectorClose"
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close media details"
            >
              <X size={21} />
            </button>
            <div className="mediaInspectorPreview">
              {selected.resourceType === 'image' ? (
                <img src={selected.url} alt={selected.filename ?? ''} />
              ) : (
                <video src={selected.url} controls autoPlay />
              )}
            </div>
            <aside>
              <small>Attachment details</small>
              <h2>{selected.filename ?? 'Untitled asset'}</h2>
              <dl>
                <div><dt>Client</dt><dd><i style={{ backgroundColor: selected.clientColor }} />{selected.clientName}</dd></div>
                <div><dt>Uploaded</dt><dd>{new Date(selected.createdAt).toLocaleString('en-GB')}</dd></div>
                <div><dt>File type</dt><dd>{selected.format?.toUpperCase() ?? selected.resourceType}</dd></div>
                <div><dt>Dimensions</dt><dd>{selected.width && selected.height ? `${selected.width} × ${selected.height}` : 'Not available'}</dd></div>
                <div><dt>File size</dt><dd>{formatBytes(selected.bytes)}</dd></div>
              </dl>
              <div className="mediaDirectLink">
                <span>Direct file URL</span>
                <div><input readOnly value={selected.url} /><button type="button" onClick={copyUrl}><Copy size={15} />{copied ? 'Copied' : 'Copy'}</button></div>
              </div>
              <section className="mediaUsage">
                <h3>Used in {selected.usages.length} content item{selected.usages.length === 1 ? '' : 's'}</h3>
                {selected.usages.length ? selected.usages.map((usage) => (
                  <Link href={`/hub/content/${usage.id}`} key={usage.id}>
                    <FileImage size={15} /><span>{usage.title}</span><ExternalLink size={14} />
                  </Link>
                )) : <p>This asset is not attached to content.</p>}
              </section>
              {selected.usages.length === 0 && (
                <form
                  className="mediaDeleteForm"
                  action={deleteUnusedMediaAction}
                >
                  <input type="hidden" name="assetId" value={selected.id} />
                  <label>
                    <input name="confirm" type="checkbox" value="yes" required />
                    <span>I understand this permanently deletes the file</span>
                  </label>
                  <button type="submit">
                    <Trash2 size={15} /> Delete unused asset
                  </button>
                </form>
              )}
            </aside>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
