'use client'

import { useActionState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import {
  createCampaignAction,
  type CampaignFormState,
  updateCampaignAction,
} from '@/app/hub/(app)/campaigns/actions'

type ClientOption = { id: string; name: string }
type CampaignValue = {
  id: string
  clientId: string
  name: string
  description: string
  startDate: string | null
  endDate: string | null
}

const initialState: CampaignFormState = {}

function Fields({
  clients,
  campaign,
  state,
}: {
  clients: ClientOption[]
  campaign?: CampaignValue
  state: CampaignFormState
}) {
  return (
    <>
      <div className="contentFormGrid">
        <label>
          <span>Client</span>
          <select name="clientId" defaultValue={campaign?.clientId ?? clients[0]?.id}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Campaign name</span>
          <input
            name="name"
            defaultValue={campaign?.name}
            placeholder="Zenrend launch campaign"
            required
            aria-invalid={Boolean(state.fields?.name)}
          />
        </label>
      </div>
      <label>
        <span>Description</span>
        <textarea
          name="description"
          defaultValue={campaign?.description}
          placeholder="Purpose, deliverables and campaign notes…"
          rows={5}
        />
      </label>
      <div className="contentFormGrid">
        <label>
          <span>Start date</span>
          <input name="startDate" type="date" defaultValue={campaign?.startDate ?? ''} />
        </label>
        <label>
          <span>End date</span>
          <input name="endDate" type="date" defaultValue={campaign?.endDate ?? ''} />
          {state.fields?.endDate?.[0] && <small>{state.fields.endDate[0]}</small>}
        </label>
      </div>
    </>
  )
}

export function NewCampaignDialog({ clients }: { clients: ClientOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, action, pending] = useActionState(
    createCampaignAction,
    initialState,
  )

  return (
    <>
      <button
        className="hubPrimaryButton"
        type="button"
        disabled={clients.length === 0}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Plus size={16} aria-hidden="true" />
        New campaign
      </button>
      <dialog className="contentDialog" ref={dialogRef}>
        <div className="clientDialogHeader">
          <div><p>Grouped work</p><h2>Create campaign</h2></div>
          <form method="dialog">
            <button type="submit" aria-label="Close"><X size={18} /></button>
          </form>
        </div>
        <form className="contentForm" action={action}>
          <Fields clients={clients} state={state} />
          {state.error && <p className="clientFormError">{state.error}</p>}
          <div className="clientFormActions">
            <button type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create campaign'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

export function EditCampaignForm({
  clients,
  campaign,
}: {
  clients: ClientOption[]
  campaign: CampaignValue
}) {
  const boundAction = updateCampaignAction.bind(null, campaign.id)
  const [state, action, pending] = useActionState(boundAction, initialState)

  return (
    <form className="contentSettingsForm" action={action}>
      <section className="contentSettingsSection">
        <div><p>Campaign details</p><span>Keep the client, brief and date range together.</span></div>
        <div className="contentSettingsFields">
          <Fields clients={clients} campaign={campaign} state={state} />
        </div>
      </section>
      {state.error && <p className="contentSettingsError">{state.error}</p>}
      <div className="clientSettingsActions">
        <span>Campaign changes apply to its workspace immediately.</span>
        <button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save campaign'}
        </button>
      </div>
    </form>
  )
}
