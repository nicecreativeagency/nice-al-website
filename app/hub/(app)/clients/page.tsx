import { ArrowUpRight, Building2, CheckCircle2, Globe2 } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PageHeader } from '@/app/hub/components/page-header'
import { NewClientDialog } from '@/app/hub/(app)/clients/new-client-dialog'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>
}) {
  const viewer = await requireAdmin()
  const { created } = await searchParams

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Workspace directory"
        title="Clients"
        description="Every brand, its members and publishing timezone in one place."
        action={<NewClientDialog />}
      />

      {created && (
        <div className="clientSuccess" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {created} was added to NICE Social Hub.
        </div>
      )}

      <section className="clientDirectory">
        <div className="directoryHeading">
          <span>
            {viewer.clients.length} active{' '}
            {viewer.clients.length === 1 ? 'client' : 'clients'}
          </span>
          <span>Access</span>
          <span>Timezone</span>
          <span aria-hidden="true" />
        </div>

        {viewer.clients.map((currentClient) => (
          <article key={currentClient.id} className="clientRow">
            <div className="clientIdentity">
              <span style={{ backgroundColor: currentClient.brandColor }}>
                {currentClient.name.charAt(0)}
              </span>
              <div>
                <strong>{currentClient.name}</strong>
                <small>/{currentClient.slug}</small>
              </div>
            </div>
            <span className="clientAccess">
              <Building2 size={15} aria-hidden="true" />
              Organization workspace
            </span>
            <span className="clientTimezone">
              <Globe2 size={15} aria-hidden="true" />
              {currentClient.timezone}
            </span>
            <button type="button" disabled aria-label={`Open ${currentClient.name}`}>
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}
