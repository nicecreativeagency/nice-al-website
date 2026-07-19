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
  client,
  contentItem,
  contentPlatformTarget,
  type SocialPlatform,
} from '@/lib/db/schema'

const updateContentSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Choose a client.'),
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

export async function updateContentAction(
  contentId: string,
  _state: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const viewer = await requireAdmin()
  const parsed = updateContentSchema.safeParse({
    clientId: formData.get('clientId'),
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
    .select({ id: contentItem.id })
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

  try {
    await db
      .update(contentItem)
      .set({
        clientId: selectedClient.id,
        title: parsed.data.title,
        contentType: parsed.data.contentType,
        caption: parsed.data.caption,
        scheduledDate: parsed.data.scheduledDate ?? null,
        scheduledTime: parsed.data.scheduledTime ?? null,
        timezone: selectedClient.timezone,
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
  } catch (error) {
    console.error('Failed to update content item', error)
    return { error: 'The content item could not be updated. Please try again.' }
  }

  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${contentId}`)
  redirect(`/hub/content/${contentId}?saved=1`)
}
