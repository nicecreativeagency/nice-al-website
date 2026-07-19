'use client'

import { useActionState, useState } from 'react'
import { CalendarDays, Check, Clock3 } from 'lucide-react'
import {
  CONTENT_TYPE_OPTIONS,
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORM_VALUES,
} from '@/lib/content-settings'
import type {
  ContentType,
  SocialPlatform,
} from '@/lib/db/schema'
import {
  updateContentAction,
  type UpdateContentState,
} from '@/app/hub/(app)/content/[contentId]/actions'

type ClientOption = {
  id: string
  name: string
}
type CampaignOption = {
  id: string
  clientId: string
  name: string
}

type EditableContent = {
  id: string
  clientId: string
  campaignId: string | null
  title: string
  contentType: string
  caption: string
  scheduledDate: string | null
  scheduledTime: string | null
  platforms: Array<{
    platform: SocialPlatform
    caption: string | null
  }>
}

const initialState: UpdateContentState = {}

export function EditContentForm({
  content,
  clients,
  campaigns,
}: {
  content: EditableContent
  clients: ClientOption[]
  campaigns: CampaignOption[]
}) {
  const initialPlatforms = content.platforms.map((target) => target.platform)
  const [platforms, setPlatforms] =
    useState<SocialPlatform[]>(initialPlatforms)
  const [customCaptions, setCustomCaptions] = useState(
    content.platforms.some((target) => target.caption !== null),
  )
  const [activeCaptionPlatform, setActiveCaptionPlatform] =
    useState<SocialPlatform>(initialPlatforms[0] ?? 'instagram')
  const updateContent = updateContentAction.bind(null, content.id)
  const [state, formAction, isPending] = useActionState(
    updateContent,
    initialState,
  )

  function togglePlatform(platform: SocialPlatform) {
    setPlatforms((current) => {
      const next = current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
      if (!next.includes(activeCaptionPlatform) && next[0]) {
        setActiveCaptionPlatform(next[0])
      }
      return next
    })
  }

  return (
    <form className="contentSettingsForm" action={formAction}>
      <section className="contentSettingsSection">
        <div>
          <p>Content</p>
          <span>The internal title, client and base social copy.</span>
        </div>

        <div className="contentSettingsFields">
          <div className="contentFormGrid">
            <label>
              <span>Client</span>
              <select
                name="clientId"
                defaultValue={content.clientId}
                aria-invalid={Boolean(state.fields?.clientId)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Content type</span>
              <select
                name="contentType"
                defaultValue={content.contentType as ContentType}
              >
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
              defaultValue={content.title}
              required
              aria-invalid={Boolean(state.fields?.title)}
            />
            {state.fields?.title?.[0] && <small>{state.fields.title[0]}</small>}
          </label>

          <label>
            <span>Campaign</span>
            <select name="campaignId" defaultValue={content.campaignId ?? ''}>
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Base caption</span>
            <textarea
              name="caption"
              defaultValue={content.caption}
              rows={7}
              aria-invalid={Boolean(state.fields?.caption)}
            />
            {state.fields?.caption?.[0] && (
              <small>{state.fields.caption[0]}</small>
            )}
          </label>
        </div>
      </section>

      <section className="contentSettingsSection">
        <div>
          <p>Distribution</p>
          <span>Choose channels and customize copy only when necessary.</span>
        </div>

        <div className="contentSettingsFields">
          <fieldset className="platformPicker">
            <legend>Platforms</legend>
            <div>
              {SOCIAL_PLATFORM_VALUES.map((platform) => (
                <label
                  key={platform}
                  className={platforms.includes(platform) ? 'selected' : ''}
                >
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                    checked={platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                  />
                  <i><Check size={14} /></i>
                  <span>{SOCIAL_PLATFORM_LABELS[platform]}</span>
                </label>
              ))}
            </div>
            {state.fields?.platforms?.[0] && (
              <small>{state.fields.platforms[0]}</small>
            )}
          </fieldset>

          <label className="captionOverrideToggle">
            <input
              type="checkbox"
              name="customCaptions"
              checked={customCaptions}
              onChange={(event) => setCustomCaptions(event.target.checked)}
            />
            <span>
              <strong>Platform-specific captions</strong>
              <small>
                Keep off to use the base caption across every selected channel.
              </small>
            </span>
          </label>

          {customCaptions && (
            <div className="captionOverrides">
              <nav aria-label="Platform captions">
                {platforms.map((platform) => (
                  <button
                    type="button"
                    key={platform}
                    className={activeCaptionPlatform === platform ? 'active' : ''}
                    onClick={() => setActiveCaptionPlatform(platform)}
                  >
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </button>
                ))}
              </nav>
              {platforms.map((platform) => (
                <label
                  key={platform}
                  className={
                    activeCaptionPlatform === platform
                      ? 'captionPanel active'
                      : 'captionPanel'
                  }
                >
                  <span>{SOCIAL_PLATFORM_LABELS[platform]} caption</span>
                  <textarea
                    name={`caption_${platform}`}
                    defaultValue={
                      content.platforms.find(
                        (target) => target.platform === platform,
                      )?.caption ?? ''
                    }
                    placeholder="Leave empty to use the base caption."
                    rows={5}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="contentSettingsSection">
        <div>
          <p>Planning</p>
          <span>The planned publishing date uses the client timezone.</span>
        </div>

        <div className="contentSettingsFields contentSettingsSplit">
          <label>
            <span>Planned date</span>
            <div className="planningInput">
              <CalendarDays size={18} />
              <input
                name="scheduledDate"
                type="date"
                defaultValue={content.scheduledDate ?? ''}
                aria-invalid={Boolean(state.fields?.scheduledDate)}
                onClick={(event) => event.currentTarget.showPicker?.()}
              />
            </div>
            {state.fields?.scheduledDate?.[0] && (
              <small>{state.fields.scheduledDate[0]}</small>
            )}
          </label>

          <label>
            <span>Planned time</span>
            <div className="planningInput">
              <Clock3 size={18} />
              <input
                name="scheduledTime"
                type="time"
                defaultValue={content.scheduledTime?.slice(0, 5) ?? ''}
                aria-invalid={Boolean(state.fields?.scheduledTime)}
                onClick={(event) => event.currentTarget.showPicker?.()}
              />
            </div>
          </label>
        </div>
      </section>

      {state.error && <p className="contentSettingsError">{state.error}</p>}

      <div className="clientSettingsActions">
        <span>Saving keeps the current approval status unchanged.</span>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save content'}
        </button>
      </div>
    </form>
  )
}
