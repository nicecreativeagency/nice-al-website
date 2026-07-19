import Link from 'next/link'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { db } from '@/lib/db'
import { client, contentItem, contentPlatformTarget } from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'

type View = 'month' | 'week' | 'list'

function monthValue(value?: string) {
  return /^\d{4}-\d{2}$/.test(value ?? '')
    ? value!
    : new Date().toISOString().slice(0, 7)
}

function shiftMonth(value: string, amount: number) {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + amount, 1))
  return date.toISOString().slice(0, 7)
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: View; month?: string; client?: string }>
}) {
  const viewer = await requireViewer()
  const params = await searchParams
  const view: View = ['month', 'week', 'list'].includes(params.view ?? '')
    ? params.view!
    : 'month'
  const selectedMonth = monthValue(params.month)
  const allowedClientIds = viewer.clients.map((item) => item.id)
  const requestedClient =
    params.client && allowedClientIds.includes(params.client) ? params.client : ''

  const rows =
    viewer.role === 'client' && allowedClientIds.length === 0
      ? []
      : await db
          .select({
            id: contentItem.id,
            title: contentItem.title,
            status: contentItem.status,
            scheduledDate: contentItem.scheduledDate,
            scheduledTime: contentItem.scheduledTime,
            clientId: client.id,
            clientName: client.name,
            clientColor: client.brandColor,
            platform: contentPlatformTarget.platform,
          })
          .from(contentItem)
          .innerJoin(client, eq(client.id, contentItem.clientId))
          .leftJoin(
            contentPlatformTarget,
            eq(contentPlatformTarget.contentItemId, contentItem.id),
          )
          .where(
            and(
              eq(contentItem.organizationId, viewer.organization.id),
              requestedClient
                ? eq(contentItem.clientId, requestedClient)
                : viewer.role === 'client'
                  ? inArray(contentItem.clientId, allowedClientIds)
                  : undefined,
            ),
          )
          .orderBy(asc(contentItem.scheduledDate), asc(contentItem.scheduledTime))

  const items = Array.from(
    rows.reduce((map, row) => {
      const existing = map.get(row.id)
      if (existing) {
        if (row.platform) existing.platforms.push(row.platform)
      } else {
        map.set(row.id, { ...row, platforms: row.platform ? [row.platform] : [] })
      }
      return map
    }, new Map<string, (typeof rows)[number] & { platforms: string[] }>()),
  ).map(([, item]) => item)

  const [year, month] = selectedMonth.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const gridStart = new Date(first)
  gridStart.setUTCDate(1 - ((first.getUTCDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + index)
    return date
  })
  const monthItems = items.filter((item) =>
    item.scheduledDate?.startsWith(selectedMonth),
  )
  const title = first.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const query = (extra: Record<string, string>) =>
    `?${new URLSearchParams({
      view,
      month: selectedMonth,
      ...(requestedClient ? { client: requestedClient } : {}),
      ...extra,
    })}`

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Publishing plan"
        title="Calendar"
        description="All planned content, approvals and publishing dates in one place."
      />
      {viewer.role !== 'client' ? (
        <section className="calendarClientSwitcher">
          <strong>Client workspace</strong>
          <nav aria-label="Filter calendar by client">
            <Link
              className={!requestedClient ? 'active' : ''}
              href={query({ client: '' })}
            >
              All clients
            </Link>
            {viewer.clients.map((item) => (
              <Link
                key={item.id}
                className={requestedClient === item.id ? 'active' : ''}
                href={query({ client: item.id })}
              >
                <i style={{ backgroundColor: item.brandColor }} />
                {item.name}
              </Link>
            ))}
          </nav>
        </section>
      ) : null}
      <section className="calendarToolbar">
        <div className="calendarPeriod">
          <Link href={query({ month: shiftMonth(selectedMonth, -1) })} aria-label="Previous month">
            <ChevronLeft size={17} />
          </Link>
          <strong>{title}</strong>
          <Link href={query({ month: shiftMonth(selectedMonth, 1) })} aria-label="Next month">
            <ChevronRight size={17} />
          </Link>
        </div>
        <form>
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="month" value={selectedMonth} />
          <select name="client" defaultValue={requestedClient} aria-label="Filter by client">
            <option value="">All clients</option>
            {viewer.clients.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <button type="submit">Filter</button>
        </form>
        <nav aria-label="Calendar view">
          {(['month', 'week', 'list'] as View[]).map((item) => (
            <Link className={view === item ? 'active' : ''} href={query({ view: item })} key={item}>
              {item}
            </Link>
          ))}
        </nav>
      </section>

      {view === 'month' ? (
        <section className="calendarMonth">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <strong key={day}>{day}</strong>)}
          {days.map((day) => {
            const date = day.toISOString().slice(0, 10)
            const dayItems = items.filter((item) => item.scheduledDate === date)
            return (
              <div className={day.getUTCMonth() === month - 1 ? '' : 'outside'} key={date}>
                <time>{day.getUTCDate()}</time>
                {dayItems.slice(0, 4).map((item) => (
                  <Link href={viewer.role === 'client' ? '/hub/approvals' : `/hub/content/${item.id}`} key={item.id} style={{ borderLeftColor: item.clientColor }}>
                    <small>{item.scheduledTime?.slice(0, 5) ?? 'Any time'} · {item.clientName}</small>
                    <span>{item.title}</span>
                  </Link>
                ))}
                {dayItems.length > 4 ? <em>+{dayItems.length - 4} more</em> : null}
              </div>
            )
          })}
        </section>
      ) : view === 'week' ? (
        <section className="calendarMonth calendarWeek">
          {days.slice(0, 7).map((day) => {
            const date = day.toISOString().slice(0, 10)
            const dayItems = items.filter((item) => item.scheduledDate === date)
            return (
              <div key={date}>
                <time>
                  {day.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  })}
                </time>
                {dayItems.map((item) => (
                  <Link
                    href={viewer.role === 'client' ? '/hub/approvals' : `/hub/content/${item.id}`}
                    key={item.id}
                    style={{ borderLeftColor: item.clientColor }}
                  >
                    <small>{item.scheduledTime?.slice(0, 5) ?? 'Any time'} · {item.clientName}</small>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </section>
      ) : (
        <section className="calendarList">
          {monthItems.length === 0 ? (
            <div className="contentEmpty">
              <span><CalendarDays size={22} /></span>
              <h2>No planned content</h2>
              <p>Content with a date in {title} will appear here.</p>
            </div>
          ) : monthItems.map((item) => (
            <Link href={viewer.role === 'client' ? '/hub/approvals' : `/hub/content/${item.id}`} key={item.id}>
              <time>{item.scheduledDate}<small>{item.scheduledTime?.slice(0, 5) ?? 'Time not set'}</small></time>
              <i style={{ background: item.clientColor }}>{item.clientName.charAt(0)}</i>
              <span><small>{item.clientName} · {item.platforms.join(', ')}</small><strong>{item.title}</strong></span>
              <em className={`contentStatus is-${item.status}`}>{item.status.replaceAll('_', ' ')}</em>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
