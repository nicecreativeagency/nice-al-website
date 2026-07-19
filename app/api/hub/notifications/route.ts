import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notification.href,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    })
    .from(notification)
    .where(
      and(
        eq(notification.organizationId, viewer.organization.id),
        eq(notification.recipientUserId, viewer.user.id),
      ),
    )
    .orderBy(desc(notification.createdAt))
    .limit(30)

  return NextResponse.json({ notifications: rows })
}
