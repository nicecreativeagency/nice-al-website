'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { recordActivity } from '@/lib/activity'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { contentItem } from '@/lib/db/schema'

const rescheduleSchema = z.object({
  contentId: z.string().uuid(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid publishing date.'),
})

export type RescheduleContentResult =
  | { ok: true; scheduledDate: string }
  | { ok: false; error: string }

export async function rescheduleContentAction(
  contentId: string,
  scheduledDate: string,
): Promise<RescheduleContentResult> {
  const viewer = await requireAdmin()
  const parsed = rescheduleSchema.safeParse({ contentId, scheduledDate })

  if (!parsed.success) {
    return { ok: false, error: 'Choose a valid publishing date.' }
  }

  const [item] = await db
    .select({
      id: contentItem.id,
      clientId: contentItem.clientId,
      title: contentItem.title,
      status: contentItem.status,
      scheduledDate: contentItem.scheduledDate,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.id, parsed.data.contentId),
        eq(contentItem.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!item) {
    return { ok: false, error: 'This content item is not available.' }
  }

  if (['published', 'archived'].includes(item.status)) {
    return {
      ok: false,
      error: `A ${item.status} item cannot be rescheduled.`,
    }
  }

  if (item.scheduledDate === parsed.data.scheduledDate) {
    return { ok: true, scheduledDate: parsed.data.scheduledDate }
  }

  try {
    await db
      .update(contentItem)
      .set({
        scheduledDate: parsed.data.scheduledDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contentItem.id, item.id),
          eq(contentItem.organizationId, viewer.organization.id),
        ),
      )

    await recordActivity({
      organizationId: viewer.organization.id,
      clientId: item.clientId,
      contentItemId: item.id,
      actor: { id: viewer.user.id, name: viewer.user.name },
      action: 'content.rescheduled',
      metadata: {
        title: item.title,
        previousDate: item.scheduledDate ?? 'Unscheduled',
        scheduledDate: parsed.data.scheduledDate,
      },
    })
  } catch (error) {
    console.error('Failed to reschedule content item', error)
    return {
      ok: false,
      error: 'The publishing date could not be updated. Please try again.',
    }
  }

  revalidatePath('/hub/calendar')
  revalidatePath('/hub/content')
  revalidatePath(`/hub/content/${item.id}`)
  revalidatePath('/hub/dashboard')

  return { ok: true, scheduledDate: parsed.data.scheduledDate }
}
