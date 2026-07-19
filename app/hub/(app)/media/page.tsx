import { desc, eq } from 'drizzle-orm'
import { CheckCircle2, FolderOpen } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { client, contentItem, contentMedia, mediaAsset } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import {
  MediaLibrary,
  type MediaLibraryAsset,
} from '@/app/hub/(app)/media/media-library'

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const viewer = await requireAdmin()
  const params = await searchParams
  const rows = await db
    .select({
      id: mediaAsset.id,
      url: mediaAsset.secureUrl,
      resourceType: mediaAsset.resourceType,
      filename: mediaAsset.originalFilename,
      format: mediaAsset.format,
      bytes: mediaAsset.bytes,
      width: mediaAsset.width,
      height: mediaAsset.height,
      createdAt: mediaAsset.createdAt,
      clientName: client.name,
      clientColor: client.brandColor,
      contentId: contentItem.id,
      contentTitle: contentItem.title,
    })
    .from(mediaAsset)
    .innerJoin(client, eq(client.id, mediaAsset.clientId))
    .leftJoin(contentMedia, eq(contentMedia.mediaAssetId, mediaAsset.id))
    .leftJoin(contentItem, eq(contentItem.id, contentMedia.contentItemId))
    .where(eq(mediaAsset.organizationId, viewer.organization.id))
    .orderBy(desc(mediaAsset.createdAt))

  const assets = Array.from(
    rows.reduce((map, row) => {
      const existing = map.get(row.id)
      if (existing) {
        if (
          row.contentId &&
          row.contentTitle &&
          !existing.usages.some((usage) => usage.id === row.contentId)
        ) {
          existing.usages.push({ id: row.contentId, title: row.contentTitle })
        }
        return map
      }
      map.set(row.id, {
        id: row.id,
        url: row.url,
        resourceType: row.resourceType,
        filename: row.filename,
        format: row.format,
        bytes: row.bytes,
        width: row.width,
        height: row.height,
        createdAt: row.createdAt.toISOString(),
        clientName: row.clientName,
        clientColor: row.clientColor,
        usages:
          row.contentId && row.contentTitle
            ? [{ id: row.contentId, title: row.contentTitle }]
            : [],
      })
      return map
    }, new Map<string, MediaLibraryAsset>()),
  ).map(([, asset]) => asset)

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Asset library"
        title="Media"
        description="Inspect every final asset, see where it is used and copy its direct link."
      />
      {params.deleted && (
        <div className="clientSuccess">
          <CheckCircle2 size={17} /> The unused asset was permanently deleted.
        </div>
      )}
      {params.error && (
        <div className="accessNotice">
          {params.error === 'in-use'
            ? 'This asset is still used in content and cannot be deleted.'
            : 'The asset could not be deleted. No content was changed.'}
        </div>
      )}
      {assets.length === 0 ? (
        <section className="contentEmpty">
          <span><FolderOpen size={24} /></span>
          <h2>No media yet</h2>
          <p>Assets uploaded inside content items will be collected here automatically.</p>
        </section>
      ) : (
        <MediaLibrary assets={assets} />
      )}
    </div>
  )
}
