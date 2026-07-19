'use client'

import { useRef } from 'react'
import { Expand, X } from 'lucide-react'

export function MediaLightbox({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        className={`mediaLightboxTrigger ${className ?? ''}`}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Open ${alt || 'image'} in full size`}
      >
        <img src={src} alt={alt} />
        <span><Expand size={16} /> Enlarge</span>
      </button>
      <dialog
        ref={dialogRef}
        className="mediaLightboxDialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close image"
        >
          <X size={22} />
        </button>
        <img src={src} alt={alt} />
      </dialog>
    </>
  )
}
