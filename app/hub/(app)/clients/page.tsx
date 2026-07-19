import { ArrowUpRight, Building2, Globe2, Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PageHeader } from '@/app/hub/components/page-header'

export default async function ClientsPage() {
  const viewer = await requireAdmin()

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Workspace directory"
        title="Clients"
        description="Every brand, its members and publishing timezone in one place."
        action={
          <button className="hubPrimaryButton" type="button" disabled>
            <Plus size={16} aria-hidden="true" />
            New client
          </button>
        }
      />

      <section className="clientDirectory">
        <div className="directoryHeading">
          <span>{viewer.clients.length} active client</span>
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
