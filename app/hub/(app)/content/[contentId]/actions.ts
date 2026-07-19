'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  CONTENT_TYPE_VALUES,
  SOCIAL_PLATFORM_VALUES,
} from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  campaign,
  approvalRequest,
  client,
  contentItem,
  contentMedia,
  contentPlatformTarget,
  contentVersion,
  mediaAsset,
  type SocialPlatform,
} from '@/lib/db/schema'
import { recordActivity } from '@/lib/activity'

const updateContentSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Choose a client.'),
    campaignId: z.string().trim().optional(),
    title: z
      .string()
      .trim()
      .min(2, 'Enter an internal title.')
      .max(140, 'Keep the title under 140 characters.'),
    contentType: z.enum(CONTENT_TYPE_VALUES),
    caption: z
      .string()
      .trim()
      .max(5000, 'Keep the caption under 5,000 characters.'),
    platforms: z
      .array(z.enum(SOCIAL_PLATFORM_VALUES))
      .min(1, 'Choose at least one platform.'),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
      .optional(),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time.')
      .optional(),
    facebookCaption: z.string().trim().max(5000).optional(),
    instagramCaption: z.string().trim().max(5000).optional(),
    linkedinCaption: z.string().trim().max(5000).optional(),
    customCaptions: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.scheduledTime && !value.scheduledDate) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledDate'],
        message: 'Choose a date when a publishing time is set.',
      })
    }
  })

export type UpdateContentState = {
  error?: string
  fields?: {
    clientId?: string[]
    title?: string[]
    contentType?: string[]
    caption?: string[]
    platforms?: string[]
    scheduledDate?: string[]
    scheduledTime?: string[]
  }
}

export async function setManualPublishingStatusAction(
  contentId: string,
  nextStatus: 'scheduled' | 'published',
) {
  const viewer = await requireAdmin()
  const [item] = await db
    .select({
      id: contentItem.id,
      clientId: contentItem.clientId,
      status: contentItem.status,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!item) redirect('/hub/content?error=not-found')

  const allowed =
    (nextStatus === 'scheduled' && item.status === 'ready_to_schedule') ||
    (nextStatus === 'published' && item.status === 'scheduled')
  if (!allowed) {
    redirect(`/hub/content/${contentId}?workflowError=invalid-transition`)
  }

  await db
    .update(contentItem)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(contentItem.id, item.id))
  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: item.clientId,
    contentItemId: item.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action:
      nextStatus === 'scheduled'
        ? 'publishing.manually_scheduled'
        : 'publishing.manually_completed',
  })

  revalidatePath(`/hub/content/${contentId}`)
  revalidatePath('/hub/content')
  revalidatePath('/hub/calendar')
  revalidatePath('/hub/dashboard')
  revalidatePath('/hub/published')
  redirect(`/hub/content/${contentId}?workflow=${nextStatus}`)
}

export async function updateContentAction(
  contentId: string,
  _state: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const viewer = await requireAdmin()
  const parsed = updateContentSchema.safeParse({
    clientId: formData.get('clientId'),
    campaignId: formData.get('campaignId') || undefined,
    title: formData.get('title'),
    contentType: formData.get('contentType'),
    caption: formData.get('caption'),
    platforms: formData.getAll('platforms'),
    scheduledDate: formData.get('scheduledDate') || undefined,
    scheduledTime: formData.get('scheduledTime') || undefined,
    facebookCaption: formData.get('caption_facebook') || undefined,
    instagramCaption: formData.get('caption_instagram') || undefined,
    linkedinCaption: formData.get('caption_linkedin') || undefined,
    customCaptions: formData.get('customCaptions') === 'on',
  })

  if (!parsed.success) {
    return {
      error: 'Check the highlighted information and try again.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const [existingItem] = await db
    .select({
      id: contentItem.id,
      currentVersion: contentItem.currentVersion,
      status: contentItem.status,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!existingItem) {
    return { error: 'This content item is not available in your organization.' }
  }

  const [selectedClient] = await db
    .select({ id: client.id, timezone: client.timezone })
    .from(client)
    .where(
      and(
        eq(client.id, parsed.data.clientId),
        eq(client.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!selectedClient) {
    return {
      error: 'The selected client is not available in your organization.',
      fields: { clientId: ['Choose a valid client.'] },
    }
  }

  let selectedCampaignId: string | null = null
  if (parsed.data.campaignId) {
    const [selectedCampaign] = await db
      .select({ id: campaign.id })
      .from(campaign)
      .where(
        and(
          eq(campaign.id, parsed.data.campaignId),
          eq(campaign.organizationId, viewer.organization.id),
          eq(campaign.clientId, selectedClient.id),
        ),
      )
      .limit(1)
    if (!selectedCampaign) {
      return { error: 'The selected campaign does not belong to this client.' }
    }
    selectedCampaignId = selectedCampaign.id
  }

  const selectedPlatforms = Array.from(new Set(parsed.data.platforms))
  const captionOverrides: Record<SocialPlatform, string | null> = {
    facebook:
      parsed.data.customCaptions && parsed.data.facebookCaption
        ? parsed.data.facebookCaption
        : null,
    instagram:
      parsed.data.customCaptions && parsed.data.instagramCaption
        ? parsed.data.instagramCaption
        : null,
    linkedin:
      parsed.data.customCaptions && parsed.data.linkedinCaption
        ? parsed.data.linkedinCaption
        : null,
  }
  const nextVersion = existingItem.currentVersion + 1

  try {
    await db
      .update(contentItem)
      .set({
        clientId: selectedClient.id,
        campaignId: selectedCampaignId,
        title: parsed.data.title,
        contentType: parsed.data.contentType,
        caption: parsed.data.caption,
        scheduledDate: parsed.data.scheduledDate ?? null,
        scheduledTime: parsed.data.scheduledTime ?? null,
        timezone: selectedClient.timezone,
        currentVersion: nextVersion,
        status: 'draft',
        approvedVersion: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contentItem.id, contentId),
          eq(contentItem.organizationId, viewer.organization.id),
        ),
      )

    const existingTargets = await db
      .select({
        id: contentPlatformTarget.id,
        platform: contentPlatformTarget.platform,
      })
      .from(contentPlatformTarget)
      .where(eq(contentPlatformTarget.contentItemId, contentId))

    await Promise.all(
      selectedPlatforms.map((platform) => {
        const existingTarget = existingTargets.find(
          (target) => target.platform === platform,
        )

        if (existingTarget) {
          return db
            .update(contentPlatformTarget)
            .set({
              caption: captionOverrides[platform],
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(contentPlatformTarget.id, existingTarget.id),
                eq(contentPlatformTarget.contentItemId, contentId),
              ),
            )
        }

        return db.insert(contentPlatformTarget).values({
          id: crypto.randomUUID(),
          contentItemId: contentId,
          platform,
          caption: captionOverrides[platform],
        })
      }),
    )

    const removedTargets = existingTargets.filter(
      (target) =>
        !selectedPlatforms.includes(target.platform as SocialPlatform),
    )

    await Promise.all(
      removedTargets.map((target) =>
        db
          .delete(contentPlatformTarget)
          .where(
            and(
              eq(contentPlatformTarget.id, target.id),
              eq(contentPlatformTarget.contentItemId, contentId),
            ),
          ),
      ),
    )

    const [savedTargets, savedMedia] = await Promise.all([
      db
        .select({
          platform: contentPlatformTarget.platform,
          caption: contentPlatformTarget.caption,
        })
        .from(contentPlatformTarget)
        .where(eq(contentPlatformTarget.contentItemId, contentId)),
      db
        .select({
          mediaAssetId: mediaAsset.id,
          secureUrl: mediaAsset.secureUrl,
          resourceType: mediaAsset.resourceType,
          sortOrder: contentMedia.sortOrder,
        })
        .from(contentMedia)
        .innerJoin(mediaAsset, eq(mediaAsset.id, contentMedia.mediaAssetId))
        .where(eq(contentMedia.contentItemId, contentId)),
    ])

    await db.insert(contentVersion).values({
      id: crypto.randomUUID(),
      contentItemId: contentId,
      versionNumber: nextVersion,
      createdByUserId: viewer.user.id,
      title: parsed.data.title,
      contentType: parsed.data.contentType,
      caption: parsed.data.caption,
      platformSnapshot: savedTargets,
      mediaSnapshot: savedMedia,
    })
    if (existingItem.status === 'waiting_approval') {
      await db
        .update(approvalRequest)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(approvalRequest.contentItemId, contentId),
            eq(approvalRequest.status, 'pending'),
          ),
        )
    }
    await recordActivity({
      organizationId: viewer.organization.id,
      clientId: selectedClient.id,
      contentItemId: contentId,
      actor: { id: viewer.user.id, name: viewer.user.name },
      action: 'content.version_created',
      metadata: { version: nextVersion, title: parsed.data.title },
    })
  } catch (error) {
    console.error('Failed to update content item', error)
    return { error: 'The content item could not be updated. Please try again.' }
  }

  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${contentId}`)
  redirect(`/hub/content/${contentId}?saved=1`)
}

export async function duplicateContentAction(contentId: string) {
  const viewer = await requireAdmin()
  const [source] = await db
    .select()
    .from(contentItem)
    .where(
      and(
        eq(contentItem.id, contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!source) redirect('/hub/content')

  const [targets, media] = await Promise.all([
    db
      .select({
        platform: contentPlatformTarget.platform,
        caption: contentPlatformTarget.caption,
      })
      .from(contentPlatformTarget)
      .where(eq(contentPlatformTarget.contentItemId, contentId)),
    db
      .select({
        mediaAssetId: mediaAsset.id,
        secureUrl: mediaAsset.secureUrl,
        resourceType: mediaAsset.resourceType,
        sortOrder: contentMedia.sortOrder,
      })
      .from(contentMedia)
      .innerJoin(mediaAsset, eq(mediaAsset.id, contentMedia.mediaAssetId))
      .where(eq(contentMedia.contentItemId, contentId)),
  ])
  const newId = crypto.randomUUID()
  const title = `Copy of ${source.title}`.slice(0, 140)

  await db.insert(contentItem).values({
    id: newId,
    organizationId: viewer.organization.id,
    clientId: source.clientId,
    campaignId: source.campaignId,
    createdByUserId: viewer.user.id,
    title,
    contentType: source.contentType,
    status: 'draft',
    caption: source.caption,
    scheduledDate: null,
    scheduledTime: null,
    timezone: source.timezone,
    currentVersion: 1,
  })
  if (targets.length) {
    await db.insert(contentPlatformTarget).values(
      targets.map((target) => ({
        id: crypto.randomUUID(),
        contentItemId: newId,
        platform: target.platform,
        caption: target.caption,
      })),
    )
  }
  if (media.length) {
    await db.insert(contentMedia).values(
      media.map((asset) => ({
        id: crypto.randomUUID(),
        contentItemId: newId,
        mediaAssetId: asset.mediaAssetId,
        sortOrder: asset.sortOrder,
      })),
    )
  }
  await db.insert(contentVersion).values({
    id: crypto.randomUUID(),
    contentItemId: newId,
    versionNumber: 1,
    createdByUserId: viewer.user.id,
    title,
    contentType: source.contentType,
    caption: source.caption,
    platformSnapshot: targets,
    mediaSnapshot: media,
  })
  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: source.clientId,
    contentItemId: newId,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'content.duplicated',
    metadata: { sourceContentId: source.id, title },
  })
  revalidatePath('/hub/content')
  redirect(`/hub/content/${newId}`)
}
