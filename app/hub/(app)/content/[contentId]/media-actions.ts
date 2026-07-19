'use server'

import { and, count, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createCloudinaryDeliveryUrl,
  createCloudinaryUploadSignature,
  getCloudinaryConfig,
  getCloudinaryFolder,
  verifyCloudinaryResponseSignature,
} from '@/lib/cloudinary'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  contentItem,
  contentMedia,
  mediaAsset,
} from '@/lib/db/schema'

const resourceTypeSchema = z.enum(['image', 'video'])

const uploadedAssetSchema = z.object({
  assetId: z.string().trim().min(1).max(255),
  publicId: z.string().trim().min(1).max(500),
  version: z.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{40}([a-f0-9]{24})?$/i),
  resourceType: resourceTypeSchema,
  format: z.string().trim().regex(/^[a-z0-9]+$/i).max(20),
  originalFilename: z.string().trim().max(500).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().max(100_000_000),
  duration: z.number().nonnegative().optional(),
})

type UploadSignatureResult =
  | {
      ok: true
      data: {
        cloudName: string
        apiKey: string
        timestamp: number
        signature: string
        folder: string
      }
    }
  | { ok: false; error: string }

async function getOwnedContent(contentId: string) {
  const viewer = await requireAdmin()
  const [ownedContent] = await db
    .select({
      id: contentItem.id,
      clientId: contentItem.clientId,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  return { viewer, ownedContent }
}

export async function createMediaUploadSignatureAction(
  contentId: string,
  resourceType: 'image' | 'video',
): Promise<UploadSignatureResult> {
  const parsedResourceType = resourceTypeSchema.safeParse(resourceType)
  if (!parsedResourceType.success) {
    return { ok: false, error: 'This file type is not supported.' }
  }

  const { viewer, ownedContent } = await getOwnedContent(contentId)
  if (!ownedContent) {
    return { ok: false, error: 'This content item is not available.' }
  }

  try {
    const { cloudName, apiKey } = getCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = getCloudinaryFolder(
      viewer.organization.slug,
      ownedContent.clientId,
    )
    const signature = createCloudinaryUploadSignature({ folder, timestamp })

    return {
      ok: true,
      data: { cloudName, apiKey, timestamp, signature, folder },
    }
  } catch (error) {
    console.error('Failed to create Cloudinary upload signature', error)
    return { ok: false, error: 'Media uploads are not configured correctly.' }
  }
}

export async function attachUploadedMediaAction(
  contentId: string,
  input: unknown,
) {
  const parsed = uploadedAssetSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Cloudinary returned invalid asset information.' }
  }

  const { viewer, ownedContent } = await getOwnedContent(contentId)
  if (!ownedContent) {
    return { ok: false, error: 'This content item is not available.' }
  }

  const { cloudName } = getCloudinaryConfig()
  const expectedFolder = getCloudinaryFolder(
    viewer.organization.slug,
    ownedContent.clientId,
  )

  if (!parsed.data.publicId.startsWith(`${expectedFolder}/`)) {
    return { ok: false, error: 'The uploaded asset is outside this workspace.' }
  }

  if (
    !verifyCloudinaryResponseSignature({
      publicId: parsed.data.publicId,
      version: parsed.data.version,
      signature: parsed.data.signature,
    })
  ) {
    return { ok: false, error: 'The Cloudinary response could not be verified.' }
  }

  const secureUrl = createCloudinaryDeliveryUrl({
    cloudName,
    resourceType: parsed.data.resourceType,
    version: parsed.data.version,
    publicId: parsed.data.publicId,
    format: parsed.data.format.toLowerCase(),
  })

  try {
    let [storedAsset] = await db
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(
        and(
          eq(mediaAsset.provider, 'cloudinary'),
          eq(mediaAsset.providerAssetId, parsed.data.assetId),
          eq(mediaAsset.organizationId, viewer.organization.id),
        ),
      )
      .limit(1)

    if (!storedAsset) {
      const mediaAssetId = crypto.randomUUID()
      await db.insert(mediaAsset).values({
        id: mediaAssetId,
        organizationId: viewer.organization.id,
        clientId: ownedContent.clientId,
        uploadedByUserId: viewer.user.id,
        provider: 'cloudinary',
        providerAssetId: parsed.data.assetId,
        publicId: parsed.data.publicId,
        resourceType: parsed.data.resourceType,
        format: parsed.data.format.toLowerCase(),
        secureUrl,
        originalFilename: parsed.data.originalFilename,
        width: parsed.data.width,
        height: parsed.data.height,
        bytes: parsed.data.bytes,
        duration: parsed.data.duration,
        version: parsed.data.version,
      })
      storedAsset = { id: mediaAssetId }
    }

    const [existingAttachment] = await db
      .select({ id: contentMedia.id })
      .from(contentMedia)
      .where(
        and(
          eq(contentMedia.contentItemId, contentId),
          eq(contentMedia.mediaAssetId, storedAsset.id),
        ),
      )
      .limit(1)

    if (!existingAttachment) {
      const [attachmentCount] = await db
        .select({ value: count() })
        .from(contentMedia)
        .where(eq(contentMedia.contentItemId, contentId))

      await db.insert(contentMedia).values({
        id: crypto.randomUUID(),
        contentItemId: contentId,
        mediaAssetId: storedAsset.id,
        sortOrder: Number(attachmentCount?.value ?? 0),
      })
    }
  } catch (error) {
    console.error('Failed to attach uploaded media', error)
    return { ok: false, error: 'The uploaded asset could not be saved.' }
  }

  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${contentId}`)
  return { ok: true }
}

export async function removeMediaAttachmentAction(
  contentId: string,
  attachmentId: string,
) {
  const { ownedContent } = await getOwnedContent(contentId)
  if (!ownedContent) {
    return { ok: false, error: 'This content item is not available.' }
  }

  await db
    .delete(contentMedia)
    .where(
      and(
        eq(contentMedia.id, attachmentId),
        eq(contentMedia.contentItemId, contentId),
      ),
    )

  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${contentId}`)
  return { ok: true }
}
