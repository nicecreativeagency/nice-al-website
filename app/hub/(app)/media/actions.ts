'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { recordActivity } from '@/lib/activity'
import { deleteCloudinaryAsset } from '@/lib/cloudinary'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { contentMedia, mediaAsset } from '@/lib/db/schema'

export async function deleteUnusedMediaAction(formData: FormData) {
  const viewer = await requireAdmin()
  const assetId = z.string().uuid().safeParse(formData.get('assetId'))
  if (!assetId.success || formData.get('confirm') !== 'yes') {
    redirect('/hub/media?error=invalid-request')
  }

  const [asset] = await db
    .select({
      id: mediaAsset.id,
      provider: mediaAsset.provider,
      providerAssetId: mediaAsset.providerAssetId,
      resourceType: mediaAsset.resourceType,
      filename: mediaAsset.originalFilename,
    })
    .from(mediaAsset)
    .where(
      and(
        eq(mediaAsset.id, assetId.data),
        eq(mediaAsset.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!asset) redirect('/hub/media?error=not-found')

  const [usage] = await db
    .select({ id: contentMedia.id })
    .from(contentMedia)
    .where(eq(contentMedia.mediaAssetId, asset.id))
    .limit(1)
  if (usage) redirect('/hub/media?error=in-use')

  try {
    if (asset.provider === 'cloudinary') {
      if (
        !asset.providerAssetId ||
        (asset.resourceType !== 'image' && asset.resourceType !== 'video')
      ) {
        throw new Error('The Cloudinary asset reference is incomplete.')
      }
      await deleteCloudinaryAsset({
        publicId: asset.providerAssetId,
        resourceType: asset.resourceType,
      })
    }
    await db.delete(mediaAsset).where(eq(mediaAsset.id, asset.id))
    await recordActivity({
      organizationId: viewer.organization.id,
      actor: { id: viewer.user.id, name: viewer.user.name },
      action: 'media.deleted',
      metadata: {
        mediaAssetId: asset.id,
        filename: asset.filename ?? 'Untitled asset',
      },
    })
  } catch (error) {
    console.error('Failed to delete media asset', error)
    redirect('/hub/media?error=delete-failed')
  }

  revalidatePath('/hub/media')
  redirect('/hub/media?deleted=1')
}
