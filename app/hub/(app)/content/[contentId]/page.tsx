import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  CONTENT_STATUS_LABELS,
  getContentTypeLabel,
} from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  client,
  contentItem,
  contentPlatformTarget,
  type ContentStatus,
  type SocialPlatform,
} from '@/lib/db/schema'
import { EditContentForm } from '@/app/hub/(app)/content/[contentId]/edit-content-form'

export default async function ContentWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ contentId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const viewer = await requireAdmin()
  const { contentId } = await params
  const { saved } = await searchParams

  const [currentContent] = await db
    .select({
      id: contentItem.id,
      clientId: contentItem.clientId,
      clientName: client.name,
      clientColor: client.brandColor,
      title: contentItem.title,
      contentType: contentItem.contentType,
      status: contentItem.status,
      caption: contentItem.caption,
      scheduledDate: contentItem.scheduledDate,
      scheduledTime: contentItem.scheduledTime,
    })
    .from(contentItem)
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!currentContent) notFound()

  const targets = await db
    .select({
      platform: contentPlatformTarget.platform,
      caption: contentPlatformTarget.caption,
    })
    .from(contentPlatformTarget)
    .where(eq(contentPlatformTarget.contentItemId, currentContent.id))

  return (
    <div className="hubPage">
      <Link className="clientBackLink" href="/hub/content">
        <ArrowLeft size={15} aria-hidden="true" />
        All content
      </Link>

      <div className="contentWorkspaceHeader">
        <span style={{ backgroundColor: currentContent.clientColor }}>
          <FileText size={22} aria-hidden="true" />
        </span>
        <div>
          <p>
            {currentContent.clientName}
            <i aria-hidden="true">·</i>
            {getContentTypeLabel(currentContent.contentType)}
          </p>
          <h1>{currentContent.title}</h1>
        </div>
        <span className={`contentStatus is-${currentContent.status}`}>
          {CONTENT_STATUS_LABELS[currentContent.status as ContentStatus]}
        </span>
      </div>

      {saved && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          Content changes were saved.
        </div>
      )}

      <EditContentForm
        clients={viewer.clients}
        content={{
          id: currentContent.id,
          clientId: currentContent.clientId,
          title: currentContent.title,
          contentType: currentContent.contentType,
          caption: currentContent.caption,
          scheduledDate: currentContent.scheduledDate,
          scheduledTime: currentContent.scheduledTime,
          platforms: targets.map((target) => ({
            platform: target.platform as SocialPlatform,
            caption: target.caption,
          })),
        }}
      />
    </div>
  )
}
