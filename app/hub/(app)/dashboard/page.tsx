import Link from 'next/link'
import { and, desc, eq, inArray } from 'drizzle-orm'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { client, contentItem, notification } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import { markAllNotificationsReadFormAction } from '@/app/hub/notification-actions'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const viewer = await requireViewer()
  const params = await searchParams
  const isClient = viewer.role === 'client'
  const clientIds = viewer.clients.map((item) => item.id)
  const scopedItems = isClient && clientIds.length === 0 ? [] : await db
    .select({
      id: contentItem.id,
      title: contentItem.title,
      status: contentItem.status,
      date: contentItem.scheduledDate,
      time: contentItem.scheduledTime,
      clientName: client.name,
      clientColor: client.brandColor,
    })
    .from(contentItem)
    .innerJoin(client, eq(client.id, contentItem.clientId))
    .where(and(
      eq(contentItem.organizationId, viewer.organization.id),
      isClient ? inArray(contentItem.clientId, clientIds) : undefined,
    ))
    .orderBy(desc(contentItem.updatedAt))

  const today = new Date().toISOString().slice(0, 10)
  const scheduledToday = scopedItems.filter((item) => item.date === today && item.status === 'scheduled')
  const attention = scopedItems.filter((item) => ['changes_requested', 'failed'].includes(item.status))
  const upcoming = scopedItems
    .filter((item) => item.date && item.date >= today && ['approved', 'ready_to_schedule', 'scheduled'].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6)
  const notices = await db
    .select()
    .from(notification)
    .where(eq(notification.recipientUserId, viewer.user.id))
    .orderBy(desc(notification.createdAt))
    .limit(5)
  const unreadNotices = notices.filter((item) => !item.readAt).length

  return (
    <div className="hubPage">
      {params.notice === 'access-denied' ? (
        <div className="accessNotice" role="status">
          <ShieldCheck size={17} />
          That area is reserved for NICE administrators.
        </div>
      ) : null}
      <PageHeader
        eyebrow={isClient ? viewer.clients[0]?.name ?? 'Client portal' : 'Overview'}
        title={`Good to see you, ${viewer.user.name.split(' ')[0]}.`}
        description={isClient ? 'Review shared content and see what is planned next.' : 'A focused view of work moving across every client.'}
        action={!isClient ? <Link className="hubPrimaryButton" href="/hub/content">Create content <ArrowUpRight size={16} /></Link> : undefined}
      />
      <section className="metricGrid">
        <article><span className="metricIcon neutral"><CalendarClock size={19} /></span><div><strong>{scheduledToday.length}</strong><span>Scheduled today</span></div><small>{scheduledToday.length ? 'On queue' : 'Clear'}</small></article>
        <article><span className="metricIcon warm"><Clock3 size={19} /></span><div><strong>{viewer.pendingApprovals}</strong><span>Waiting approval</span></div><small>{viewer.pendingApprovals ? 'Needs review' : 'None pending'}</small></article>
        <article><span className="metricIcon red"><AlertCircle size={19} /></span><div><strong>{attention.length}</strong><span>Needs attention</span></div><small>{attention.length ? 'Action needed' : 'All good'}</small></article>
        <article><span className="metricIcon green"><CheckCircle2 size={19} /></span><div><strong>{viewer.clients.length}</strong><span>{isClient ? 'Assigned workspace' : 'Active clients'}</span></div><small>Connected</small></article>
      </section>
      <div className="dashboardGrid">
        <section className="todayPanel">
          <div className="panelHeading">
            <div><p>{isClient ? 'Next up' : 'Upcoming content'}</p><span>Approved and scheduled content</span></div>
            <Link href="/hub/calendar">View all <ArrowUpRight size={15} /></Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="emptyQueue"><span className="emptyQueueIcon"><CheckCircle2 size={22} /></span><h2>Nothing is waiting on you.</h2><p>Planned content will appear here automatically.</p></div>
          ) : (
            <div className="dashboardQueue">
              {upcoming.map((item) => (
                <Link href={isClient ? '/hub/calendar' : `/hub/content/${item.id}`} key={item.id}>
                  <i style={{ background: item.clientColor }}>{item.clientName.charAt(0)}</i>
                  <span><small>{item.clientName} · {item.date} {item.time?.slice(0, 5)}</small><strong>{item.title}</strong></span>
                  <em className={`contentStatus is-${item.status}`}>{item.status.replaceAll('_', ' ')}</em>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="foundationPanel notificationPanel">
          <div className="notificationPanelHeader">
            <p>Recent notifications</p>
            {unreadNotices > 0 && (
              <form action={markAllNotificationsReadFormAction}>
                <button type="submit">Mark all read</button>
              </form>
            )}
          </div>
          {notices.length === 0 ? <span className="foundationNext">No notifications yet</span> : (
            <ul>{notices.map((item) => (
              <li className={item.readAt ? 'is-read' : ''} key={item.id}>
                <CheckCircle2 size={15} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                  {item.href && <Link href={item.href}>Open</Link>}
                </span>
              </li>
            ))}</ul>
          )}
        </aside>
      </div>
    </div>
  )
}
