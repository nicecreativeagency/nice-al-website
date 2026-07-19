'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/schema'

const notificationIdSchema = z.string().uuid()

export async function markNotificationReadAction(notificationId: string) {
  const viewer = await requireViewer()
  const parsedId = notificationIdSchema.safeParse(notificationId)
  if (!parsedId.success) return { ok: false as const }

  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.id, parsedId.data),
        eq(notification.organizationId, viewer.organization.id),
        eq(notification.recipientUserId, viewer.user.id),
        isNull(notification.readAt),
      ),
    )

  revalidatePath('/hub', 'layout')
  revalidatePath('/hub/dashboard')
  return { ok: true as const }
}

export async function markAllNotificationsReadAction() {
  const viewer = await requireViewer()
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.organizationId, viewer.organization.id),
        eq(notification.recipientUserId, viewer.user.id),
        isNull(notification.readAt),
      ),
    )

  revalidatePath('/hub', 'layout')
  revalidatePath('/hub/dashboard')
  return { ok: true as const }
}

export async function markAllNotificationsReadFormAction() {
  await markAllNotificationsReadAction()
}
