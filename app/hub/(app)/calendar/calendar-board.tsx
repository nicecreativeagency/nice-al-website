'use client'

import Link from 'next/link'
import {
  CalendarClock,
  GripVertical,
  LockKeyhole,
  MoveRight,
} from 'lucide-react'
import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  rescheduleContentAction,
  type RescheduleContentResult,
} from './actions'

export type CalendarItem = {
  id: string
  title: string
  status: string
  scheduledDate: string | null
  scheduledTime: string | null
  clientId: string
  clientName: string
  clientColor: string
  platforms: string[]
}

type CalendarDay = {
  date: string
  dayNumber: number
  label: string
  outside: boolean
}

function canMove(item: CalendarItem, editable: boolean) {
  return editable && !['published', 'archived'].includes(item.status)
}

function ContentCard({
  item,
  editable,
  busyId,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  item: CalendarItem
  editable: boolean
  busyId: string | null
  onDragStart: (event: DragEvent<HTMLElement>, item: CalendarItem) => void
  onDragEnd: () => void
  onMove: (item: CalendarItem, date: string) => Promise<RescheduleContentResult>
}) {
  const movable = canMove(item, editable)
  const [date, setDate] = useState(item.scheduledDate ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDate(item.scheduledDate ?? '')
  }, [item.scheduledDate])

  async function submitMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedDate = String(
      new FormData(event.currentTarget).get('scheduledDate') ?? '',
    )
    if (!selectedDate) return
    const result = await onMove(item, selectedDate)
    if (result.ok) setOpen(false)
  }

  return (
    <article
      className={`calendarContentCard${busyId === item.id ? ' is-busy' : ''}`}
      draggable={movable && busyId !== item.id}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, item)}
      style={{ borderLeftColor: item.clientColor }}
    >
      <div className="calendarCardMain">
        {movable ? (
          <GripVertical
            aria-hidden="true"
            className="calendarDragHandle"
            size={14}
          />
        ) : null}
        <Link href={editable ? `/hub/content/${item.id}` : '/hub/approvals'}>
          <small>
            {item.scheduledDate
              ? (item.scheduledTime?.slice(0, 5) ?? 'Any time')
              : 'Unscheduled'}{' '}
            · {item.clientName}
          </small>
          <span>{item.title}</span>
        </Link>
        {editable ? (
          movable ? (
            <button
              aria-expanded={open}
              aria-label={
                item.scheduledDate
                  ? `Move ${item.title} to another date`
                  : `Schedule ${item.title}`
              }
              className="calendarMoveButton"
              onClick={() => setOpen((value) => !value)}
              title={
                item.scheduledDate ? 'Move to another date' : 'Choose a date'
              }
              type="button"
            >
              <CalendarClock size={14} />
            </button>
          ) : (
            <span
              aria-label={`${item.status} content is locked`}
              className="calendarLocked"
              title={`${item.status} content cannot be moved`}
            >
              <LockKeyhole size={13} />
            </span>
          )
        ) : null}
      </div>
      {movable && open ? (
        <form className="calendarMoveForm" onSubmit={submitMove}>
          <label>
            <span>{item.scheduledDate ? 'New date' : 'Publishing date'}</span>
            <input
              aria-label={`New publishing date for ${item.title}`}
              name="scheduledDate"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>
          <button disabled={busyId === item.id} type="submit">
            <MoveRight size={13} />
            {busyId === item.id
              ? 'Saving…'
              : item.scheduledDate
                ? 'Move'
                : 'Schedule'}
          </button>
        </form>
      ) : null}
    </article>
  )
}

export function CalendarBoard({
  days,
  initialItems,
  editable,
  week,
}: {
  days: CalendarDay[]
  initialItems: CalendarItem[]
  editable: boolean
  week?: boolean
}) {
  const [items, setItems] = useState(initialItems)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropDate, setDropDate] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  async function moveItem(item: CalendarItem, date: string) {
    const previousDate = item.scheduledDate
    setBusyId(item.id)
    setMessage('')
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id
          ? { ...candidate, scheduledDate: date }
          : candidate,
      ),
    )

    const result = await rescheduleContentAction(item.id, date)
    if (!result.ok) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, scheduledDate: previousDate }
            : candidate,
        ),
      )
      setMessage(result.error)
    } else {
      setMessage(
        item.scheduledDate
          ? `${item.title} moved to ${date}.`
          : `${item.title} scheduled for ${date}.`,
      )
    }
    setBusyId(null)
    return result
  }

  function startDrag(event: DragEvent<HTMLElement>, item: CalendarItem) {
    if (!canMove(item, editable)) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
    setDraggedId(item.id)
  }

  function allowDrop(event: DragEvent<HTMLDivElement>, date: string) {
    if (!editable || !draggedId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropDate(date)
  }

  async function drop(event: DragEvent<HTMLDivElement>, date: string) {
    event.preventDefault()
    const itemId = event.dataTransfer.getData('text/plain') || draggedId
    const item = items.find((candidate) => candidate.id === itemId)
    setDraggedId(null)
    setDropDate(null)
    if (!item || item.scheduledDate === date || !canMove(item, editable)) return
    await moveItem(item, date)
  }

  return (
    <>
      {editable ? (
        <section className="calendarBacklog">
          <header>
            <div>
              <strong>Unscheduled content</strong>
              <span>
                Drag unfinished planning directly into the calendar.
              </span>
            </div>
            <em>{items.filter((item) => !item.scheduledDate).length}</em>
          </header>
          {items.some((item) => !item.scheduledDate) ? (
            <div className="calendarBacklogCards">
              {items
                .filter((item) => !item.scheduledDate)
                .map((item) => (
                  <ContentCard
                    busyId={busyId}
                    editable={editable}
                    item={item}
                    key={item.id}
                    onDragEnd={() => {
                      setDraggedId(null)
                      setDropDate(null)
                    }}
                    onDragStart={startDrag}
                    onMove={moveItem}
                  />
                ))}
            </div>
          ) : (
            <p>Everything in this workspace already has a publishing date.</p>
          )}
        </section>
      ) : null}
      <div className="calendarBoardNotice" aria-live="polite">
        {message ? (
          <span
            className={
              message.includes('moved to') || message.includes('scheduled for')
                ? 'is-success'
                : 'is-error'
            }
          >
            {message}
          </span>
        ) : editable ? (
          <span>Drag a card to another day, or use its calendar button.</span>
        ) : (
          <span>Calendar dates are managed by NICE.</span>
        )}
      </div>
      <section className={`calendarMonth${week ? ' calendarWeek' : ''}`}>
        {!week
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <strong key={day}>{day}</strong>
            ))
          : null}
        {days.map((day) => {
          const dayItems = items.filter(
            (item) => item.scheduledDate === day.date,
          )
          return (
            <div
              className={`${day.outside ? 'outside' : ''}${
                dropDate === day.date ? ' is-drop-target' : ''
              }`}
              key={day.date}
              onDragEnter={(event) => allowDrop(event, day.date)}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropDate(null)
                }
              }}
              onDragOver={(event) => allowDrop(event, day.date)}
              onDrop={(event) => drop(event, day.date)}
            >
              <time>{week ? day.label : day.dayNumber}</time>
              {dayItems.slice(0, week ? undefined : 4).map((item) => (
                <ContentCard
                  busyId={busyId}
                  editable={editable}
                  item={item}
                  key={item.id}
                  onDragEnd={() => {
                    setDraggedId(null)
                    setDropDate(null)
                  }}
                  onDragStart={startDrag}
                  onMove={moveItem}
                />
              ))}
              {!week && dayItems.length > 4 ? (
                <em>+{dayItems.length - 4} more</em>
              ) : null}
            </div>
          )
        })}
      </section>
    </>
  )
}
