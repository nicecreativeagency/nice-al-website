import Link from 'next/link'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Archive, ArrowUpRight } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { client, contentItem } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'

export default async function PublishedPage() {
  const viewer = await requireViewer()
  const clientIds = viewer.clients.map((item) => item.id)
  const items = viewer.role === 'client' && clientIds.length === 0 ? [] : await db
    .select({
      id: contentItem.id,
      title: contentItem.title,
      date: contentItem.scheduledDate,
      clientName: client.name,
      clientColor: client.brandColor,
    })
    .from(contentItem)
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .where(and(
      eq(contentItem.organizationId, viewer.organization.id),
      eq(contentItem.status, 'published'),
      viewer.role === 'client' ? inArray(contentItem.clientId, clientIds) : undefined,
    ))
    .orderBy(desc(contentItem.scheduledDate))

  return (
    <div className="hubPage">
      <PageHeader eyebrow="Content history" title="Published" description="Approved content that has gone live." />
      {items.length === 0 ? (
        <section className="contentEmpty">
          <span><Archive size={22} /></span>
          <h2>No published content yet</h2>
          <p>Publishing history will appear here when direct or manual publishing is enabled.</p>
        </section>
      ) : (
        <section className="approvalDirectory">
          {items.map((item) => (
            <Link href={`/hub/content/${item.id}`} key={item.id}>
              <span style={{ backgroundColor: item.clientColor }}>{item.clientName.charAt(0)}</span>
              <div><small>{item.clientName}</small><strong>{item.title}</strong><time>{item.date}</time></div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
