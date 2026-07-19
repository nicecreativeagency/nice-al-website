'use client'

import { useActionState, useState } from 'react'
import {
  updateClientAction,
  type UpdateClientState,
} from '@/app/hub/(app)/clients/[clientId]/actions'
import {
  CLIENT_TIMEZONE_OPTIONS,
  type ClientTimezone,
} from '@/lib/client-settings'

type EditableClient = {
  id: string
  name: string
  slug: string
  brandColor: string
  timezone: string
}

const initialState: UpdateClientState = {}

export function EditClientForm({ client }: { client: EditableClient }) {
  const [brandColor, setBrandColor] = useState(client.brandColor)
  const pickerColor = /^#[0-9a-fA-F]{6}$/.test(brandColor)
    ? brandColor
    : '#ff5a36'
  const updateClient = updateClientAction.bind(null, client.id)
  const [state, formAction, isPending] = useActionState(
    updateClient,
    initialState,
  )

  return (
    <form className="clientSettingsForm" action={formAction}>
      <div className="clientSettingsSection">
        <div>
          <p>Identity</p>
          <span>How this client appears throughout NICE Social Hub.</span>
        </div>

        <div className="clientSettingsFields">
          <label>
            <span>Client name</span>
            <input
              name="name"
              defaultValue={client.name}
              required
              autoComplete="organization"
              aria-invalid={Boolean(state.fields?.name)}
            />
            {state.fields?.name?.[0] && <small>{state.fields.name[0]}</small>}
          </label>

          <label>
            <span>Workspace URL</span>
            <div className="lockedField">
              <span>/hub/clients/</span>
              <input value={client.slug} readOnly aria-label="Workspace slug" />
            </div>
            <em>The workspace URL stays stable when the client name changes.</em>
          </label>
        </div>
      </div>

      <div className="clientSettingsSection">
        <div>
          <p>Brand & region</p>
          <span>Used for workspace accents and future publishing schedules.</span>
        </div>

        <div className="clientSettingsFields clientSettingsSplit">
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
            <select
              name="timezone"
              defaultValue={client.timezone as ClientTimezone}
            >
              {CLIENT_TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {state.error && <p className="clientFormError">{state.error}</p>}

      <div className="clientSettingsActions">
        <span>Changes apply immediately across this organization.</span>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
