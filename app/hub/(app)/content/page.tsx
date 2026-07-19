import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileStack,
  Filter,
  Layers3,
  Search,
  X,
} from 'lucide-react'
import {
  CONTENT_TYPE_OPTIONS,
  CONTENT_STATUS_LABELS,
  getContentTypeLabel,
  SOCIAL_PLATFORM_LABELS,
} from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  campaign,
  client,
  contentItem,
  contentPlatformTarget,
  type ContentStatus,
  type ContentType,
  type SocialPlatform,
} from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import { NewContentDialog } from '@/app/hub/(app)/content/new-content-dialog'
import { BulkContentForm } from '@/app/hub/(app)/content/bulk-content-form'

type ContentListItem = {
  id: string
  clientId: string
  title: string
  contentType: ContentType
  status: ContentStatus
  clientName: string
  clientColor: string
  scheduledDate: string | null
  scheduledTime: string | null
  platforms: SocialPlatform[]
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string
    q?: string
    client?: string
    type?: string
    status?: string
    platform?: string
    schedule?: string
    sort?: string
    bulk?: string
    bulkAction?: string
    bulkError?: string
    create?: string
  }>
}) {
  const viewer = await requireAdmin()
  const filters = await searchParams
  const { created } = filters

  const campaigns = await db
    .select({
      id: campaign.id,
      clientId: campaign.clientId,
      name: campaign.name,
    })
    .from(campaign)
    .where(eq(campaign.organizationId, viewer.organization.id))
    .orderBy(desc(campaign.createdAt))

  const rows = await db
    .select({
      id: contentItem.id,
      clientId: client.id,
      title: contentItem.title,
      contentType: contentItem.contentType,
      status: contentItem.status,
      clientName: client.name,
      clientColor: client.brandColor,
      scheduledDate: contentItem.scheduledDate,
      scheduledTime: contentItem.scheduledTime,
      platform: contentPlatformTarget.platform,
    })
    .from(contentItem)
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .leftJoin(
      contentPlatformTarget,
      eq(contentPlatformTarget.contentItemId, contentItem.id),
    )
    .where(eq(contentItem.organizationId, viewer.organization.id))
    .orderBy(desc(contentItem.createdAt))

  const allItems = Array.from(
    rows.reduce((collection, row) => {
      const existing = collection.get(row.id)
      if (existing) {
        if (row.platform) existing.platforms.push(row.platform as SocialPlatform)
        return collection
      }

      collection.set(row.id, {
        id: row.id,
        clientId: row.clientId,
        title: row.title,
        contentType: row.contentType as ContentType,
        status: row.status as ContentStatus,
        clientName: row.clientName,
        clientColor: row.clientColor,
        scheduledDate: row.scheduledDate,
        scheduledTime: row.scheduledTime,
        platforms: row.platform ? [row.platform as SocialPlatform] : [],
      })
      return collection
    }, new Map<string, ContentListItem>()),
  ).map(([, item]) => item)
  const today = new Date().toISOString().slice(0, 10)
  const items = allItems
    .filter((item) => {
      if (
        filters.q &&
        !`${item.title} ${item.clientName}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())
      ) return false
      if (filters.client && item.clientId !== filters.client) return false
      if (filters.type && item.contentType !== filters.type) return false
      if (filters.status && item.status !== filters.status) return false
      if (
        filters.platform &&
        !item.platforms.includes(filters.platform as SocialPlatform)
      ) return false
      if (filters.schedule === 'planned' && !item.scheduledDate) return false
      if (filters.schedule === 'unplanned' && item.scheduledDate) return false
      if (
        filters.schedule === 'upcoming' &&
        (!item.scheduledDate || item.scheduledDate < today)
      ) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'schedule') {
        return (a.scheduledDate ?? '9999').localeCompare(
          b.scheduledDate ?? '9999',
        )
      }
      if (filters.sort === 'client') return a.clientName.localeCompare(b.clientName)
      return 0
    })
  const activeFilterCount = [
    filters.q,
    filters.client,
    filters.type,
    filters.status,
    filters.platform,
    filters.schedule,
  ].filter(Boolean).length

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Content operations"
        title="Content"
        description="Create and prepare content for every client and social channel."
        action={
          <NewContentDialog
            campaigns={campaigns}
            clients={viewer.clients}
            initiallyOpen={filters.create === '1'}
          />
        }
      />

      {created && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {created} was saved as a draft.
        </div>
      )}
      {filters.bulk && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {filters.bulk} content items were updated.
        </div>
      )}
      {filters.bulkError && (
        <div className="accessNotice" role="alert">
          Select at least one content item before applying a bulk action.
        </div>
      )}

      <section className="contentViewBar">
        <nav aria-label="Quick content views">
          <Link href="/hub/content" className={!activeFilterCount ? 'active' : ''}>
            All <span>{allItems.length}</span>
          </Link>
          <Link
            href="/hub/content?status=waiting_approval"
            className={filters.status === 'waiting_approval' ? 'active' : ''}
          >
            Waiting <span>{allItems.filter((item) => item.status === 'waiting_approval').length}</span>
          </Link>
          <Link
            href="/hub/content?schedule=upcoming"
            className={filters.schedule === 'upcoming' ? 'active' : ''}
          >
            Upcoming <span>{allItems.filter((item) => item.scheduledDate && item.scheduledDate >= today).length}</span>
          </Link>
          <Link
            href="/hub/content?schedule=unplanned"
            className={filters.schedule === 'unplanned' ? 'active' : ''}
          >
            Unplanned <span>{allItems.filter((item) => !item.scheduledDate).length}</span>
          </Link>
          <Link
            href="/hub/content?status=changes_requested"
            className={filters.status === 'changes_requested' ? 'active' : ''}
          >
            Changes <span>{allItems.filter((item) => item.status === 'changes_requested').length}</span>
          </Link>
        </nav>
      </section>

      <form className="contentFilterBar">
        <label className="contentSearch">
          <Search size={18} />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search title or client…"
          />
        </label>
        <select name="client" defaultValue={filters.client ?? ''} aria-label="Client">
          <option value="">All clients</option>
          {viewer.clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select name="type" defaultValue={filters.type ?? ''} aria-label="Content type">
          <option value="">All types</option>
          {CONTENT_TYPE_OPTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <select name="status" defaultValue={filters.status ?? ''} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <select name="platform" defaultValue={filters.platform ?? ''} aria-label="Platform">
          <option value="">All platforms</option>
          {Object.entries(SOCIAL_PLATFORM_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <select name="schedule" defaultValue={filters.schedule ?? ''} aria-label="Schedule">
          <option value="">Any schedule</option>
          <option value="planned">Planned</option>
          <option value="upcoming">Upcoming</option>
          <option value="unplanned">Unplanned</option>
        </select>
        <select name="sort" defaultValue={filters.sort ?? ''} aria-label="Sort">
          <option value="">Newest first</option>
          <option value="schedule">By schedule</option>
          <option value="client">By client</option>
        </select>
        <button type="submit"><Filter size={17} /> Apply</button>
        {activeFilterCount ? (
          <Link href="/hub/content" className="clearFilters"><X size={16} /> Clear</Link>
        ) : null}
      </form>

      {items.length === 0 ? (
        <section className="contentEmpty">
          <span>
            <FileStack size={22} aria-hidden="true" />
          </span>
          <h2>{activeFilterCount ? 'No matching content' : 'No content yet'}</h2>
          <p>
            {activeFilterCount
              ? 'Adjust or clear the filters to see more content.'
              : 'Create the first draft to start planning, approvals and publishing.'}
          </p>
        </section>
      ) : (
        <BulkContentForm itemCount={items.length}>
          <section className="contentDirectory contentDirectoryBulk">
            <div className="contentDirectoryHeading">
              <span aria-hidden="true" />
              <span>{items.length} of {allItems.length} content items</span>
              <span>Platforms</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>

            {items.map((item) => (
              <article className="contentRow" key={item.id}>
                <label className="contentBulkCheckbox">
                  <input
                    type="checkbox"
                    name="contentIds"
                    value={item.id}
                    aria-label={`Select ${item.title}`}
                  />
                </label>
                <div className="contentIdentity">
                  <span style={{ backgroundColor: item.clientColor }}>
                    {item.clientName.charAt(0)}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.clientName}
                      <i aria-hidden="true">·</i>
                      {getContentTypeLabel(item.contentType)}
                    </small>
                  </div>
                </div>

                <div className="contentPlatforms">
                  <Layers3 size={14} aria-hidden="true" />
                  <span>
                    {item.platforms
                      .map((platform) => SOCIAL_PLATFORM_LABELS[platform])
                      .join(', ')}
                  </span>
                </div>

                <div className="contentSchedule">
                  <CalendarClock size={14} aria-hidden="true" />
                  <span>
                    {item.scheduledDate
                      ? `${item.scheduledDate}${
                          item.scheduledTime
                            ? ` · ${item.scheduledTime.slice(0, 5)}`
                            : ''
                        }`
                      : 'Not planned'}
                  </span>
                </div>

                <span className={`contentStatus is-${item.status}`}>
                  {CONTENT_STATUS_LABELS[item.status]}
                </span>

                <Link
                  className="contentOpenLink"
                  href={`/hub/content/${item.id}`}
                  aria-label={`Open ${item.title}`}
                >
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </section>
        </BulkContentForm>
      )}
    </div>
  )
}
