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
} from '@/lib/db/schema'

const createContentSchema = z
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

export type CreateContentState = {
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

export async function createContentAction(
  _state: CreateContentState,
  formData: FormData,
): Promise<CreateContentState> {
  const viewer = await requireAdmin()
  const parsed = createContentSchema.safeParse({
    clientId: formData.get('clientId'),
    title: formData.get('title'),
    contentType: formData.get('contentType'),
    caption: formData.get('caption'),
    platforms: formData.getAll('platforms'),
    scheduledDate: formData.get('scheduledDate') || undefined,
    scheduledTime: formData.get('scheduledTime') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Check the highlighted information and try again.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const [selectedClient] = await db
    .select({
      id: client.id,
      timezone: client.timezone,
    })
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

  const contentItemId = crypto.randomUUID()

  try {
    await db.insert(contentItem).values({
      id: contentItemId,
      organizationId: viewer.organization.id,
      clientId: selectedClient.id,
      createdByUserId: viewer.user.id,
      title: parsed.data.title,
      contentType: parsed.data.contentType,
      status: 'draft',
      caption: parsed.data.caption,
      scheduledDate: parsed.data.scheduledDate,
      scheduledTime: parsed.data.scheduledTime,
      timezone: selectedClient.timezone,
    })

    await db.insert(contentPlatformTarget).values(
      parsed.data.platforms.map((platform) => ({
        id: crypto.randomUUID(),
        contentItemId,
        platform,
      })),
    )
  } catch (error) {
    await db
      .delete(contentItem)
      .where(
        and(
          eq(contentItem.id, contentItemId),
          eq(contentItem.organizationId, viewer.organization.id),
        ),
      )
      .catch(() => undefined)

    console.error('Failed to create content item', error)
    return { error: 'The content item could not be created. Please try again.' }
  }

  revalidatePath('/hub/content')
  redirect(`/hub/content?created=${encodeURIComponent(parsed.data.title)}`)
}
