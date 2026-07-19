'use client'

import { useActionState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import {
  CONTENT_TYPE_OPTIONS,
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORM_VALUES,
} from '@/lib/content-settings'
import {
  createContentAction,
  type CreateContentState,
} from '@/app/hub/(app)/content/actions'

type ClientOption = {
  id: string
  name: string
}

const initialState: CreateContentState = {}

export function NewContentDialog({ clients }: { clients: ClientOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, isPending] = useActionState(
    createContentAction,
    initialState,
  )

  return (
    <>
      <button
        className="hubPrimaryButton"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        disabled={clients.length === 0}
      >
        <Plus size={16} aria-hidden="true" />
        New content
      </button>

      <dialog className="contentDialog" ref={dialogRef}>
        <div className="clientDialogHeader">
          <div>
            <p>New draft</p>
            <h2>Create content</h2>
          </div>
          <form method="dialog">
            <button type="submit" aria-label="Close dialog">
              <X size={18} aria-hidden="true" />
            </button>
          </form>
        </div>

        <form className="contentForm" action={formAction}>
          <div className="contentFormGrid">
            <label>
              <span>Client</span>
              <select
                name="clientId"
                defaultValue={clients[0]?.id}
                aria-invalid={Boolean(state.fields?.clientId)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {state.fields?.clientId?.[0] && (
                <small>{state.fields.clientId[0]}</small>
              )}
            </label>

            <label>
              <span>Content type</span>
              <select name="contentType" defaultValue="image_post">
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Internal title</span>
            <input
              name="title"
              placeholder="IVECO eDaily product post"
              required
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(state.fields?.title)}
            />
            {state.fields?.title?.[0] && <small>{state.fields.title[0]}</small>}
          </label>

          <label>
            <span>Caption</span>
            <textarea
              name="caption"
              placeholder="Write the base caption for this content…"
              rows={6}
              aria-invalid={Boolean(state.fields?.caption)}
            />
            {state.fields?.caption?.[0] && (
              <small>{state.fields.caption[0]}</small>
            )}
          </label>

          <fieldset className="platformPicker">
            <legend>Platforms</legend>
            <div>
              {SOCIAL_PLATFORM_VALUES.map((platform) => (
                <label key={platform}>
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                  />
                  <span>{SOCIAL_PLATFORM_LABELS[platform]}</span>
                </label>
              ))}
            </div>
            {state.fields?.platforms?.[0] && (
              <small>{state.fields.platforms[0]}</small>
            )}
          </fieldset>

          <div className="contentFormGrid">
            <label>
              <span>Planned date</span>
              <input
                name="scheduledDate"
                type="date"
                aria-invalid={Boolean(state.fields?.scheduledDate)}
              />
              {state.fields?.scheduledDate?.[0] && (
                <small>{state.fields.scheduledDate[0]}</small>
              )}
            </label>

            <label>
              <span>Planned time</span>
              <input
                name="scheduledTime"
                type="time"
                aria-invalid={Boolean(state.fields?.scheduledTime)}
              />
              {state.fields?.scheduledTime?.[0] && (
                <small>{state.fields.scheduledTime[0]}</small>
              )}
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
              {isPending ? 'Creating…' : 'Create draft'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
