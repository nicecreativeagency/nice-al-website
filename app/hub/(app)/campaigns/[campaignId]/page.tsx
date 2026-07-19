import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Send } from 'lucide-react'
import { notFound } from 'next/navigation'
import { CONTENT_STATUS_LABELS } from '@/lib/content-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { campaign, client, contentItem, type ContentStatus } from '@/lib/db/schema'
import { EditCampaignForm } from '@/app/hub/(app)/campaigns/campaign-form'
import { sendCampaignForApprovalAction } from '@/app/hub/(app)/campaigns/actions'
import { CampaignReviewLink } from '@/app/hub/(app)/campaigns/campaign-review-link'

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>
  searchParams: Promise<{ saved?: string; created?: string; approvals?: string }>
}) {
  const viewer = await requireAdmin()
  const { campaignId } = await params
  const notices = await searchParams
  const [current] = await db
    .select({
      id: campaign.id,
      clientId: campaign.clientId,
      clientName: client.name,
      clientColor: client.brandColor,
      name: campaign.name,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    })
    .from(campaign)
    .innerJoin(client, eq(client.id, campaign.clientId))
    .where(
      and(
        eq(campaign.id, campaignId),
        eq(campaign.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)
  if (!current) notFound()

  const items = await db
    .select({
      id: contentItem.id,
      title: contentItem.title,
      status: contentItem.status,
      scheduledDate: contentItem.scheduledDate,
    })
    .from(contentItem)
    .where(eq(contentItem.campaignId, current.id))
    .orderBy(desc(contentItem.createdAt))

  return (
    <div className="hubPage">
      <Link className="clientBackLink" href="/hub/campaigns"><ArrowLeft size={15} />All campaigns</Link>
      <div className="clientWorkspaceHeader">
        <span style={{ backgroundColor: current.clientColor }}>{current.clientName.charAt(0)}</span>
        <div><p>{current.clientName}</p><h1>{current.name}</h1><small>{items.length} content items</small></div>
      </div>
      {(notices.saved || notices.created) && (
        <div className="clientSuccess"><CheckCircle2 size={16} />Campaign saved.</div>
      )}
      {notices.approvals && (
        <div className="clientSuccess">
          <CheckCircle2 size={16} />
          {notices.approvals} campaign items were sent for approval.
        </div>
      )}
      <div className="campaignWorkspaceGrid">
        <EditCampaignForm clients={viewer.clients} campaign={current} />
        <aside className="campaignContentPanel">
          <div>
            <p>Campaign content</p>
            <span>{items.length} items</span>
            {items.length > 0 && (
              <form action={sendCampaignForApprovalAction.bind(null, current.id)}>
                <button className="campaignApprovalButton" type="submit">
                  <Send size={14} /> Send all for approval
                </button>
              </form>
            )}
          </div>
          {items.length > 0 && (
            <CampaignReviewLink campaignId={current.id} />
          )}
          {items.length === 0 ? <p>No content assigned yet.</p> : items.map((item) => (
            <Link href={`/hub/content/${item.id}`} key={item.id}>
              <span><strong>{item.title}</strong><small>{item.scheduledDate ?? 'Not planned'}</small></span>
              <em>{CONTENT_STATUS_LABELS[item.status as ContentStatus]}</em>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </aside>
      </div>
    </div>
  )
}
