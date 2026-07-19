'use client'

import {
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  LoaderCircle,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/hub/notification-actions'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function NotificationCenter({
  open,
  onOpenChange,
  onUnreadChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnreadChange: (count: number) => void
}) {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    setLoading(true)
    fetch('/api/hub/notifications', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load notifications')
        return response.json() as Promise<{ notifications: NotificationItem[] }>
      })
      .then((payload) => {
        setItems(payload.notifications)
        onUnreadChange(
          payload.notifications.filter((item) => !item.readAt).length,
        )
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setItems([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [onUnreadChange, open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange, open])

  async function markOne(item: NotificationItem, navigate = false) {
    if (!item.readAt) {
      const result = await markNotificationReadAction(item.id)
      if (result.ok) {
        const readAt = new Date().toISOString()
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id ? { ...candidate, readAt } : candidate,
          ),
        )
        onUnreadChange(
          Math.max(0, items.filter((candidate) => !candidate.readAt).length - 1),
        )
      }
    }

    if (navigate && item.href) {
      onOpenChange(false)
      router.push(item.href)
    }
  }

  async function markAll() {
    setWorking(true)
    const result = await markAllNotificationsReadAction()
    if (result.ok) {
      const readAt = new Date().toISOString()
      setItems((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
      )
      onUnreadChange(0)
      router.refresh()
    }
    setWorking(false)
  }

  if (!open) return null

  const unreadCount = items.filter((item) => !item.readAt).length

  return (
    <div
      className="notificationCenterBackdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false)
      }}
      role="presentation"
    >
      <aside
        aria-label="Notifications"
        aria-modal="true"
        className="notificationCenter"
        role="dialog"
      >
        <header>
          <div>
            <span>
              <Bell size={16} />
            </span>
            <div>
              <strong>Notifications</strong>
              <small>
                {unreadCount
                  ? `${unreadCount} unread`
                  : 'You are all caught up'}
              </small>
            </div>
          </div>
          <button
            aria-label="Close notifications"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        {unreadCount > 0 ? (
          <div className="notificationCenterActions">
            <button disabled={working} onClick={markAll} type="button">
              <CheckCheck size={14} />
              {working ? 'Updating…' : 'Mark all as read'}
            </button>
          </div>
        ) : null}

        <div className="notificationCenterFeed">
          {loading ? (
            <div className="notificationCenterState">
              <LoaderCircle className="is-spinning" size={22} />
              <span>Loading notifications…</span>
            </div>
          ) : items.length ? (
            items.map((item) => (
              <article
                className={item.readAt ? 'is-read' : 'is-unread'}
                key={item.id}
              >
                <span className="notificationStateIcon">
                  {item.readAt ? <Check size={14} /> : <Bell size={14} />}
                </span>
                <div>
                  <small>
                    {item.type.replaceAll('_', ' ')} ·{' '}
                    {formatNotificationDate(item.createdAt)}
                  </small>
                  <strong>{item.title}</strong>
                  {item.body ? <p>{item.body}</p> : null}
                  <div>
                    {item.href ? (
                      <button
                        onClick={() => markOne(item, true)}
                        type="button"
                      >
                        Open
                        <ArrowUpRight size={13} />
                      </button>
                    ) : null}
                    {!item.readAt ? (
                      <button onClick={() => markOne(item)} type="button">
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="notificationCenterState">
              <span className="notificationEmptyIcon">
                <CheckCheck size={22} />
              </span>
              <strong>No notifications yet</strong>
              <span>Approvals, feedback and publishing updates appear here.</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
