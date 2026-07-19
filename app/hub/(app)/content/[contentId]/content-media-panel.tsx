'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, ImageIcon, LoaderCircle, Trash2, Upload } from 'lucide-react'
import {
  attachUploadedMediaAction,
  createMediaUploadSignatureAction,
  removeMediaAttachmentAction,
} from '@/app/hub/(app)/content/[contentId]/media-actions'
import { MediaLightbox } from '@/app/hub/components/media-lightbox'

type AttachedMedia = {
  attachmentId: string
  assetId: string
  resourceType: string
  secureUrl: string
  originalFilename: string | null
  format: string | null
  width: number | null
  height: number | null
  bytes: number | null
}

type CloudinaryUploadResponse = {
  asset_id: string
  public_id: string
  version: number
  signature: string
  resource_type: 'image' | 'video'
  format: string
  secure_url: string
  original_filename?: string
  width?: number
  height?: number
  bytes: number
  duration?: number
  error?: { message?: string }
}

const acceptedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const maxFileBytes = 95 * 1024 * 1024

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function ContentMediaPanel({
  contentId,
  media,
}: {
  contentId: string
  media: AttachedMedia[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function uploadFile(file: File) {
    if (!acceptedTypes.has(file.type)) {
      throw new Error(`${file.name}: unsupported file type.`)
    }

    if (file.size > maxFileBytes) {
      throw new Error(`${file.name}: keep files under 95 MB.`)
    }

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
    const signatureResult = await createMediaUploadSignatureAction(
      contentId,
      resourceType,
    )

    if (!signatureResult.ok) {
      throw new Error(signatureResult.error)
    }

    const uploadBody = new FormData()
    uploadBody.set('file', file)
    uploadBody.set('api_key', signatureResult.data.apiKey)
    uploadBody.set('timestamp', String(signatureResult.data.timestamp))
    uploadBody.set('signature', signatureResult.data.signature)
    uploadBody.set('folder', signatureResult.data.folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureResult.data.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: uploadBody,
      },
    )
    const result = (await response.json()) as CloudinaryUploadResponse

    if (!response.ok || result.error) {
      throw new Error(
        result.error?.message || `${file.name}: Cloudinary upload failed.`,
      )
    }

    const attached = await attachUploadedMediaAction(contentId, {
      assetId: result.asset_id,
      publicId: result.public_id,
      version: result.version,
      signature: result.signature,
      resourceType: result.resource_type,
      format: result.format,
      originalFilename: result.original_filename || file.name,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      duration: result.duration,
    })

    if (!attached.ok) {
      throw new Error(attached.error)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return

    const selectedFiles = Array.from(files).slice(0, 10)
    setIsUploading(true)
    setMessage(`Uploading 1 of ${selectedFiles.length}…`)

    try {
      for (const [index, file] of selectedFiles.entries()) {
        setMessage(`Uploading ${index + 1} of ${selectedFiles.length}…`)
        await uploadFile(file)
      }
      setMessage(
        `${selectedFiles.length} ${
          selectedFiles.length === 1 ? 'asset' : 'assets'
        } uploaded.`,
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function removeAttachment(attachmentId: string) {
    setRemovingId(attachmentId)
    setMessage(null)
    const result = await removeMediaAttachmentAction(contentId, attachmentId)
    if (!result.ok) {
      setMessage(result.error ?? 'The media attachment could not be removed.')
    }
    router.refresh()
    setRemovingId(null)
  }

  return (
    <section className="contentMediaPanel">
      <div className="contentMediaHeading">
        <div>
          <p>Creative assets</p>
          <span>Final images and videos attached to this content item.</span>
        </div>

        <label className={isUploading ? 'isDisabled' : ''}>
          {isUploading ? (
            <LoaderCircle className="spinner" size={16} aria-hidden="true" />
          ) : (
            <Upload size={16} aria-hidden="true" />
          )}
          {isUploading ? 'Uploading…' : 'Upload media'}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            disabled={isUploading}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {message && (
        <p className={message.toLowerCase().includes('failed') ? 'isError' : ''}>
          {message}
        </p>
      )}

      {media.length === 0 ? (
        <div className="contentMediaEmpty">
          <ImageIcon size={20} aria-hidden="true" />
          <span>No creative attached yet.</span>
        </div>
      ) : (
        <div className="contentMediaGrid">
          {media.map((asset) => (
            <article key={asset.attachmentId}>
              <div className="contentMediaPreview">
                {asset.resourceType === 'video' ? (
                  <video src={asset.secureUrl} controls preload="metadata" />
                ) : (
                  <MediaLightbox
                    src={asset.secureUrl}
                    alt={asset.originalFilename || 'Content creative'}
                  />
                )}
                <span>
                  {asset.resourceType === 'video' ? (
                    <Film size={13} aria-hidden="true" />
                  ) : (
                    <ImageIcon size={13} aria-hidden="true" />
                  )}
                  {asset.format?.toUpperCase()}
                </span>
              </div>
              <div className="contentMediaMeta">
                <div>
                  <strong>
                    {asset.originalFilename || asset.assetId.slice(0, 12)}
                  </strong>
                  <small>
                    {asset.width && asset.height
                      ? `${asset.width} × ${asset.height}`
                      : 'Media asset'}
                    {asset.bytes ? ` · ${formatBytes(asset.bytes)}` : ''}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(asset.attachmentId)}
                  disabled={removingId === asset.attachmentId}
                  aria-label={`Remove ${
                    asset.originalFilename || 'media asset'
                  }`}
                >
                  {removingId === asset.attachmentId ? (
                    <LoaderCircle
                      className="spinner"
                      size={15}
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
