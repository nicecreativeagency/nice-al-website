import Link from 'next/link'
import { and, asc, desc, eq } from 'drizzle-orm'
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  CONTENT_STATUS_LABELS,
  getContentTypeLabel,
} from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { getContentReadiness } from '@/lib/content-readiness'
import { db } from '@/lib/db'
import {
  activityEvent,
  approvalRequest,
  client,
  campaign,
  contentMedia,
  contentItem,
  contentPlatformTarget,
  contentVersion,
  mediaAsset,
  type ContentStatus,
  type SocialPlatform,
} from '@/lib/db/schema'
import { EditContentForm } from '@/app/hub/(app)/content/[contentId]/edit-content-form'
import { ContentMediaPanel } from '@/app/hub/(app)/content/[contentId]/content-media-panel'
import { ApprovalWorkflowPanel } from '@/app/hub/(app)/content/[contentId]/approval-workflow-panel'

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
      campaignId: contentItem.campaignId,
      clientName: client.name,
      clientColor: client.brandColor,
      title: contentItem.title,
      contentType: contentItem.contentType,
      status: contentItem.status,
      caption: contentItem.caption,
      scheduledDate: contentItem.scheduledDate,
      scheduledTime: contentItem.scheduledTime,
      currentVersion: contentItem.currentVersion,
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

  const campaigns = await db
    .select({
      id: campaign.id,
      clientId: campaign.clientId,
      name: campaign.name,
    })
    .from(campaign)
    .where(eq(campaign.organizationId, viewer.organization.id))

  const targets = await db
    .select({
      platform: contentPlatformTarget.platform,
      caption: contentPlatformTarget.caption,
    })
    .from(contentPlatformTarget)
    .where(eq(contentPlatformTarget.contentItemId, currentContent.id))

  const attachedMedia = await db
    .select({
      attachmentId: contentMedia.id,
      assetId: mediaAsset.id,
      resourceType: mediaAsset.resourceType,
      secureUrl: mediaAsset.secureUrl,
      originalFilename: mediaAsset.originalFilename,
      format: mediaAsset.format,
      width: mediaAsset.width,
      height: mediaAsset.height,
      bytes: mediaAsset.bytes,
    })
    .from(contentMedia)
    .innerJoin(mediaAsset, eq(mediaAsset.id, contentMedia.mediaAssetId))
    .where(eq(contentMedia.contentItemId, currentContent.id))
    .orderBy(asc(contentMedia.sortOrder), asc(contentMedia.createdAt))

  const [latestApproval] = await db
    .select({
      id: approvalRequest.id,
      status: approvalRequest.status,
      versionNumber: approvalRequest.versionNumber,
      requestedAt: approvalRequest.requestedAt,
    })
    .from(approvalRequest)
    .where(eq(approvalRequest.contentItemId, currentContent.id))
    .orderBy(desc(approvalRequest.requestedAt))
    .limit(1)

  const versions = await db
    .select({
      id: contentVersion.id,
      versionNumber: contentVersion.versionNumber,
      title: contentVersion.title,
      createdAt: contentVersion.createdAt,
    })
    .from(contentVersion)
    .where(eq(contentVersion.contentItemId, currentContent.id))
    .orderBy(desc(contentVersion.versionNumber))
    .limit(10)

  const activity = await db
    .select({
      id: activityEvent.id,
      actorName: activityEvent.actorName,
      action: activityEvent.action,
      createdAt: activityEvent.createdAt,
    })
    .from(activityEvent)
    .where(eq(activityEvent.contentItemId, currentContent.id))
    .orderBy(desc(activityEvent.createdAt))
    .limit(12)

  const readiness = getContentReadiness({
    caption: currentContent.caption,
    scheduledDate: currentContent.scheduledDate,
    scheduledTime: currentContent.scheduledTime,
    platforms: targets.map((target) => ({
      platform: target.platform as SocialPlatform,
      caption: target.caption,
    })),
    mediaCount: attachedMedia.length,
  })

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

      <ContentMediaPanel contentId={currentContent.id} media={attachedMedia} />

      <div className="contentWorkflowGrid">
        <ApprovalWorkflowPanel
          contentId={currentContent.id}
          currentVersion={currentContent.currentVersion}
          contentStatus={currentContent.status}
          latestApproval={latestApproval ?? null}
          readiness={readiness}
        />
        <aside className="versionActivityPanel">
          <details open>
            <summary>
              Version history <span>{versions.length}</span>
            </summary>
            {versions.map((version) => (
              <div key={version.id}>
                <strong>Version {version.versionNumber}</strong>
                <small>{version.title}</small>
                <time>{version.createdAt.toLocaleDateString('en-GB')}</time>
              </div>
            ))}
          </details>
          <details>
            <summary>
              Activity <span>{activity.length}</span>
            </summary>
            {activity.map((event) => (
              <div key={event.id}>
                <strong>{event.actorName}</strong>
                <small>{event.action.replaceAll('.', ' ')}</small>
                <time>{event.createdAt.toLocaleDateString('en-GB')}</time>
              </div>
            ))}
          </details>
        </aside>
      </div>

      <EditContentForm
        clients={viewer.clients}
        campaigns={campaigns}
        content={{
          id: currentContent.id,
          clientId: currentContent.clientId,
          campaignId: currentContent.campaignId,
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
