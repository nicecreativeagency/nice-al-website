import { desc, eq } from 'drizzle-orm'
import {
  CalendarClock,
  CheckCircle2,
  FileStack,
  Layers3,
} from 'lucide-react'
import {
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_OPTIONS,
  SOCIAL_PLATFORM_LABELS,
} from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  client,
  contentItem,
  contentPlatformTarget,
  type ContentStatus,
  type ContentType,
  type SocialPlatform,
} from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import { NewContentDialog } from '@/app/hub/(app)/content/new-content-dialog'

type ContentListItem = {
  id: string
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
  searchParams: Promise<{ created?: string }>
}) {
  const viewer = await requireAdmin()
  const { created } = await searchParams

  const rows = await db
    .select({
      id: contentItem.id,
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

  const items = Array.from(
    rows.reduce((collection, row) => {
      const existing = collection.get(row.id)
      if (existing) {
        if (row.platform) existing.platforms.push(row.platform as SocialPlatform)
        return collection
      }

      collection.set(row.id, {
        id: row.id,
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

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Content operations"
        title="Content"
        description="Create and prepare content for every client and social channel."
        action={<NewContentDialog clients={viewer.clients} />}
      />

      {created && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {created} was saved as a draft.
        </div>
      )}

      {items.length === 0 ? (
        <section className="contentEmpty">
          <span>
            <FileStack size={22} aria-hidden="true" />
          </span>
          <h2>No content yet</h2>
          <p>
            Create the first draft to start planning, approvals and publishing.
          </p>
        </section>
      ) : (
        <section className="contentDirectory">
          <div className="contentDirectoryHeading">
            <span>{items.length} content items</span>
            <span>Platforms</span>
            <span>Schedule</span>
            <span>Status</span>
          </div>

          {items.map((item) => (
            <article className="contentRow" key={item.id}>
              <div className="contentIdentity">
                <span style={{ backgroundColor: item.clientColor }}>
                  {item.clientName.charAt(0)}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.clientName}
                    <i aria-hidden="true">·</i>
                    {CONTENT_TYPE_OPTIONS.find(
                      (option) => option.value === item.contentType,
                    )?.label ?? item.contentType}
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
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
