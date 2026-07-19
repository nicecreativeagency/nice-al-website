import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import { ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { approvalRequest, client, contentItem } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'

export default async function ApprovalsPage() {
  const viewer = await requireViewer()
  const clientIds = viewer.clients.map((item) => item.id)
  const rows =
    viewer.role === 'client' && clientIds.length === 0
      ? []
      : await db
          .select({
            id: approvalRequest.id,
            status: approvalRequest.status,
            versionNumber: approvalRequest.versionNumber,
            requestedAt: approvalRequest.requestedAt,
            title: contentItem.title,
            contentId: contentItem.id,
            clientName: client.name,
            clientColor: client.brandColor,
          })
          .from(approvalRequest)
          .innerJoin(contentItem, eq(contentItem.id, approvalRequest.contentItemId))
          .innerJoin(client, eq(client.id, contentItem.clientId))
          .where(
            viewer.role === 'client'
              ? inArray(contentItem.clientId, clientIds)
              : eq(approvalRequest.organizationId, viewer.organization.id),
          )
          .orderBy(desc(approvalRequest.requestedAt))

  const pendingCount = rows.filter((row) => row.status === 'pending').length

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Client decisions"
        title="Approvals"
        description={
          viewer.role === 'client'
            ? 'Review and respond to content shared by NICE.'
            : 'Track every pending decision and revision request.'
        }
      />
      <div className="approvalSummary">
        <span><Clock3 size={17} /><strong>{pendingCount}</strong> waiting</span>
        <span><CheckCircle2 size={17} /><strong>{rows.length - pendingCount}</strong> completed</span>
      </div>
      {rows.length === 0 ? (
        <section className="contentEmpty">
          <span><CheckCircle2 size={22} /></span>
          <h2>No approval requests</h2>
          <p>Content sent for client review will appear here.</p>
        </section>
      ) : (
        <section className="approvalDirectory">
          {rows.map((row) => (
            <Link href={`/hub/approvals/${row.id}`} key={row.id}>
              <span style={{ backgroundColor: row.clientColor }}>{row.clientName.charAt(0)}</span>
              <div><small>{row.clientName} · Version {row.versionNumber}</small><strong>{row.title}</strong><time>{row.requestedAt.toLocaleDateString('en-GB')}</time></div>
              <em className={`approvalBadge is-${row.status}`}>{row.status.replaceAll('_', ' ')}</em>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
