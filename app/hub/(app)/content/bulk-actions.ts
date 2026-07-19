'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createApprovalRequestAction } from '@/app/hub/(app)/approvals/actions'
import { recordActivity } from '@/lib/activity'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { approvalRequest, contentItem } from '@/lib/db/schema'

const bulkSchema = z.object({
  action: z.enum(['archive', 'draft', 'send_approval']),
  contentIds: z.array(z.string().uuid()).min(1).max(100),
})

export async function bulkContentAction(formData: FormData) {
  const viewer = await requireAdmin()
  const parsed = bulkSchema.safeParse({
    action: formData.get('action'),
    contentIds: formData.getAll('contentIds'),
  })
  if (!parsed.success) redirect('/hub/content?bulkError=selection')

  const rows = await db
    .select({
      id: contentItem.id,
      clientId: contentItem.clientId,
      title: contentItem.title,
    })
    .from(contentItem)
    .where(
      and(
        eq(contentItem.organizationId, viewer.organization.id),
        inArray(contentItem.id, parsed.data.contentIds),
      ),
    )
  if (!rows.length) redirect('/hub/content?bulkError=selection')

  if (parsed.data.action === 'send_approval') {
    let completed = 0
    for (const row of rows) {
      const result = await createApprovalRequestAction(row.id, '')
      if (result.ok) completed += 1
    }
    redirect(`/hub/content?bulk=${completed}&bulkAction=approval`)
  }

  const nextStatus = parsed.data.action === 'archive' ? 'archived' : 'draft'
  await db
    .update(contentItem)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(
      and(
        eq(contentItem.organizationId, viewer.organization.id),
        inArray(contentItem.id, rows.map((row) => row.id)),
      ),
    )
  await db
    .update(approvalRequest)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(approvalRequest.organizationId, viewer.organization.id),
        inArray(
          approvalRequest.contentItemId,
          rows.map((row) => row.id),
        ),
        eq(approvalRequest.status, 'pending'),
      ),
    )
  await Promise.all(
    rows.map((row) =>
      recordActivity({
        organizationId: viewer.organization.id,
        clientId: row.clientId,
        contentItemId: row.id,
        actor: { id: viewer.user.id, name: viewer.user.name },
        action: `content.${nextStatus}`,
        metadata: { title: row.title, bulk: true },
      }),
    ),
  )

  revalidatePath('/hub/content')
  revalidatePath('/hub/approvals')
  redirect(
    `/hub/content?bulk=${rows.length}&bulkAction=${encodeURIComponent(nextStatus)}`,
  )
}
