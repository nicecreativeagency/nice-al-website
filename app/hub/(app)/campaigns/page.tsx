import Link from 'next/link'
import { count, desc, eq } from 'drizzle-orm'
import { ArrowUpRight, CalendarRange, Megaphone } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { campaign, client, contentItem } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import { NewCampaignDialog } from '@/app/hub/(app)/campaigns/campaign-form'

export default async function CampaignsPage() {
  const viewer = await requireAdmin()
  const rows = await db
    .select({
      id: campaign.id,
      name: campaign.name,
      clientName: client.name,
      clientColor: client.brandColor,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      itemCount: count(contentItem.id),
    })
    .from(campaign)
    .innerJoin(client, eq(client.id, campaign.clientId))
    .leftJoin(contentItem, eq(contentItem.campaignId, campaign.id))
    .where(eq(campaign.organizationId, viewer.organization.id))
    .groupBy(campaign.id, client.id)
    .orderBy(desc(campaign.createdAt))

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Grouped work"
        title="Campaigns"
        description="Keep related content, dates and approval progress together."
        action={<NewCampaignDialog clients={viewer.clients} />}
      />
      {rows.length === 0 ? (
        <section className="contentEmpty">
          <span><Megaphone size={22} /></span>
          <h2>No campaigns yet</h2>
          <p>Create a campaign when several content items belong to one launch or monthly plan.</p>
        </section>
      ) : (
        <section className="campaignGrid">
          {rows.map((item) => (
            <Link href={`/hub/campaigns/${item.id}`} key={item.id}>
              <span style={{ backgroundColor: item.clientColor }}>{item.clientName.charAt(0)}</span>
              <div>
                <small>{item.clientName}</small>
                <h2>{item.name}</h2>
                <p><CalendarRange size={13} /> {item.startDate ?? 'No start'} — {item.endDate ?? 'Open'}</p>
              </div>
              <footer>
                <span>{item.itemCount} content items</span>
                <ArrowUpRight size={16} />
              </footer>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
