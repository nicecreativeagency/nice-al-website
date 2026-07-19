'use client'

import { useActionState, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  createClientAction,
  type CreateClientState,
} from '@/app/hub/(app)/clients/actions'

const initialState: CreateClientState = {}

export function NewClientDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [brandColor, setBrandColor] = useState('#ff5a36')
  const pickerColor = /^#[0-9a-fA-F]{6}$/.test(brandColor)
    ? brandColor
    : '#ff5a36'
  const [state, formAction, isPending] = useActionState(
    createClientAction,
    initialState,
  )

  return (
    <>
      <button
        className="hubPrimaryButton"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Plus size={16} aria-hidden="true" />
        New client
      </button>

      <dialog className="clientDialog" ref={dialogRef}>
        <div className="clientDialogHeader">
          <div>
            <p>New workspace</p>
            <h2>Add a client</h2>
          </div>
          <form method="dialog">
            <button type="submit" aria-label="Close dialog">
              <X size={18} aria-hidden="true" />
            </button>
          </form>
        </div>

        <form className="clientForm" action={formAction}>
          <label>
            <span>Client name</span>
            <input
              name="name"
              placeholder="IVECO"
              autoComplete="organization"
              required
              autoFocus
              aria-invalid={Boolean(state.fields?.name)}
            />
            {state.fields?.name?.[0] && <small>{state.fields.name[0]}</small>}
          </label>

          <label>
            <span>Workspace slug</span>
            <div className="slugField">
              <span>/</span>
              <input
                name="slug"
                placeholder="Generated from the client name"
                autoComplete="off"
                aria-invalid={Boolean(state.fields?.slug)}
              />
            </div>
            {state.fields?.slug?.[0] ? (
              <small>{state.fields.slug[0]}</small>
            ) : (
              <em>Leave empty to generate it automatically.</em>
            )}
          </label>

          <div className="clientFormSplit">
            <label>
              <span>Brand color</span>
              <div className="colorField">
                <input
                  type="color"
                  value={pickerColor}
                  onChange={(event) => setBrandColor(event.target.value)}
                  aria-label="Brand color"
                />
                <input
                  name="brandColor"
                  value={brandColor}
                  onChange={(event) => setBrandColor(event.target.value)}
                  placeholder="#ff5a36"
                  maxLength={7}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Brand color HEX code"
                  aria-invalid={Boolean(state.fields?.brandColor)}
                />
              </div>
              {state.fields?.brandColor?.[0] && (
                <small>{state.fields.brandColor[0]}</small>
              )}
            </label>

            <label>
              <span>Timezone</span>
              <select name="timezone" defaultValue="Europe/Belgrade">
                <option value="Europe/Belgrade">Republic of Kosova</option>
                <option value="Europe/Tirane">Tirana</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Europe/London">London</option>
                <option value="America/New_York">New York</option>
              </select>
            </label>
          </div>

          {state.error && <p className="clientFormError">{state.error}</p>}

          <div className="clientFormActions">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create client'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
