import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { PageHeader } from '@/app/hub/components/page-header'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const viewer = await requireViewer()
  const params = await searchParams
  const isClient = viewer.role === 'client'

  return (
    <div className="hubPage">
      {params.notice === 'access-denied' ? (
        <div className="accessNotice" role="status">
          <ShieldCheck size={17} aria-hidden="true" />
          That area is reserved for NICE administrators.
        </div>
      ) : null}

      <PageHeader
        eyebrow={isClient ? viewer.clients[0]?.name ?? 'Client portal' : 'Overview'}
        title={`Good to see you, ${viewer.user.name.split(' ')[0]}.`}
        description={
          isClient
            ? 'Your shared content, approvals and publishing plan will live here.'
            : 'A focused view of work moving across every client.'
        }
        action={
          !isClient ? (
            <button className="hubPrimaryButton" type="button" disabled>
              Create content
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ) : undefined
        }
      />

      <section className="metricGrid" aria-label="Content status overview">
        <article>
          <span className="metricIcon neutral">
            <CalendarClock size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>0</strong>
            <span>Scheduled today</span>
          </div>
          <small>Clear</small>
        </article>
        <article>
          <span className="metricIcon warm">
            <Clock3 size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>0</strong>
            <span>Waiting approval</span>
          </div>
          <small>None pending</small>
        </article>
        <article>
          <span className="metricIcon red">
            <AlertCircle size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>0</strong>
            <span>Needs attention</span>
          </div>
          <small>All good</small>
        </article>
        <article>
          <span className="metricIcon green">
            <CheckCircle2 size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>{viewer.clients.length}</strong>
            <span>{isClient ? 'Assigned workspace' : 'Active clients'}</span>
          </div>
          <small>Connected</small>
        </article>
      </section>

      <div className="dashboardGrid">
        <section className="todayPanel">
          <div className="panelHeading">
            <div>
              <p>{isClient ? 'Pending approvals' : 'Today'}</p>
              <span>
                {isClient
                  ? 'Content that needs your decision'
                  : 'Your publishing queue across all clients'}
              </span>
            </div>
            <button type="button" disabled>
              View all
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="emptyQueue">
            <span className="emptyQueueIcon">
              <CheckCircle2 size={22} aria-hidden="true" />
            </span>
            <h2>Nothing is waiting on you.</h2>
            <p>
              {isClient
                ? 'New review requests from NICE will appear here.'
                : 'Scheduled content and action items will appear here as the content system is added.'}
            </p>
          </div>
        </section>

        <aside className="foundationPanel">
          <p>Foundation status</p>
          <div className="foundationScore">
            <strong>04</strong>
            <span>/ 04</span>
          </div>
          <ul>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Database-backed accounts
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Server-side route protection
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Organization data isolation
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Role-specific experience
            </li>
          </ul>
          <span className="foundationNext">Next: Clients &amp; content</span>
        </aside>
      </div>
    </div>
  )
}
