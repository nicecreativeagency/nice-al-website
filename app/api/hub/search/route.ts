import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { campaign, client, contentItem } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (viewer.role === 'client') {
    return NextResponse.json({ results: [] })
  }

  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 60)
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const pattern = `%${query}%`
  const [clients, content, campaigns] = await Promise.all([
    db
      .select({
        id: client.id,
        name: client.name,
      })
      .from(client)
      .where(
        and(
          eq(client.organizationId, viewer.organization.id),
          ilike(client.name, pattern),
        ),
      )
      .orderBy(client.name)
      .limit(6),
    db
      .select({
        id: contentItem.id,
        title: contentItem.title,
        status: contentItem.status,
        clientName: client.name,
      })
      .from(contentItem)
      .innerJoin(client, eq(client.id, contentItem.clientId))
      .where(
        and(
          eq(contentItem.organizationId, viewer.organization.id),
          or(
            ilike(contentItem.title, pattern),
            ilike(client.name, pattern),
          ),
        ),
      )
      .orderBy(desc(contentItem.updatedAt))
      .limit(8),
    db
      .select({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        clientName: client.name,
      })
      .from(campaign)
      .innerJoin(client, eq(client.id, campaign.clientId))
      .where(
        and(
          eq(campaign.organizationId, viewer.organization.id),
          or(ilike(campaign.name, pattern), ilike(client.name, pattern)),
        ),
      )
      .orderBy(desc(campaign.updatedAt))
      .limit(6),
  ])

  return NextResponse.json({
    results: [
      ...clients.map((item) => ({
        id: `client-${item.id}`,
        type: 'client',
        label: item.name,
        description: 'Client workspace',
        href: `/hub/clients/${item.id}`,
      })),
      ...content.map((item) => ({
        id: `content-${item.id}`,
        type: 'content',
        label: item.title,
        description: `${item.clientName} · ${item.status.replaceAll('_', ' ')}`,
        href: `/hub/content/${item.id}`,
      })),
      ...campaigns.map((item) => ({
        id: `campaign-${item.id}`,
        type: 'campaign',
        label: item.name,
        description: `${item.clientName} · ${item.status}`,
        href: `/hub/campaigns/${item.id}`,
      })),
    ],
  })
}
