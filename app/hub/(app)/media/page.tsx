import Image from 'next/image'
import { count, desc, eq } from 'drizzle-orm'
import { FileImage, FolderOpen } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { client, contentMedia, mediaAsset } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'

export default async function MediaPage() {
  const viewer = await requireAdmin()
  const assets = await db
    .select({
      id: mediaAsset.id,
      url: mediaAsset.secureUrl,
      resourceType: mediaAsset.resourceType,
      filename: mediaAsset.originalFilename,
      format: mediaAsset.format,
      bytes: mediaAsset.bytes,
      createdAt: mediaAsset.createdAt,
      clientName: client.name,
      clientColor: client.brandColor,
      usages: count(contentMedia.id),
    })
    .from(mediaAsset)
    .innerJoin(client, eq(client.id, mediaAsset.clientId))
    .leftJoin(contentMedia, eq(contentMedia.mediaAssetId, mediaAsset.id))
    .where(eq(mediaAsset.organizationId, viewer.organization.id))
    .groupBy(mediaAsset.id, client.id)
    .orderBy(desc(mediaAsset.createdAt))

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Final assets"
        title="Media"
        description="Every publishing-ready image and video uploaded across your clients."
      />
      {assets.length === 0 ? (
        <section className="contentEmpty">
          <span><FolderOpen size={22} /></span>
          <h2>No media yet</h2>
          <p>Assets uploaded inside content items will be collected here automatically.</p>
        </section>
      ) : (
        <section className="mediaLibraryGrid">
          {assets.map((asset) => (
            <article key={asset.id}>
              <div>
                {asset.resourceType === 'image' ? (
                  <Image src={asset.url} alt={asset.filename ?? ''} fill sizes="(max-width: 700px) 100vw, 25vw" />
                ) : (
                  <video src={asset.url} controls preload="metadata" />
                )}
              </div>
              <span style={{ color: asset.clientColor }}><FileImage size={15} /> {asset.clientName}</span>
              <strong>{asset.filename ?? `Untitled.${asset.format ?? 'file'}`}</strong>
              <small>{asset.usages} content use{asset.usages === 1 ? '' : 's'} · {asset.bytes ? `${(asset.bytes / 1024 / 1024).toFixed(1)} MB` : 'Size unavailable'}</small>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
