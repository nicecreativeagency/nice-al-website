import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { client } from '@/lib/db/schema'
import { EditClientForm } from '@/app/hub/(app)/clients/[clientId]/edit-client-form'

export default async function ClientWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const viewer = await requireAdmin()
  const { clientId } = await params
  const { saved } = await searchParams

  const [currentClient] = await db
    .select({
      id: client.id,
      name: client.name,
      slug: client.slug,
      brandColor: client.brandColor,
      timezone: client.timezone,
    })
    .from(client)
    .where(
      and(
        eq(client.id, clientId),
        eq(client.organizationId, viewer.organization.id),
      ),
    )
    .limit(1)

  if (!currentClient) notFound()

  return (
    <div className="hubPage">
      <Link className="clientBackLink" href="/hub/clients">
        <ArrowLeft size={15} aria-hidden="true" />
        All clients
      </Link>

      <div className="clientWorkspaceHeader">
        <span style={{ backgroundColor: currentClient.brandColor }}>
          {currentClient.name.charAt(0)}
        </span>
        <div>
          <p>Client workspace</p>
          <h1>{currentClient.name}</h1>
          <small>/{currentClient.slug}</small>
        </div>
      </div>

      {saved && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          Client settings were updated.
        </div>
      )}

      <EditClientForm client={currentClient} />
    </div>
  )
}
