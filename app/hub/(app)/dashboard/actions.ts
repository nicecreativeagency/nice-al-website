'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/schema'

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
  revalidatePath('/hub/dashboard')
  revalidatePath('/hub')
}
