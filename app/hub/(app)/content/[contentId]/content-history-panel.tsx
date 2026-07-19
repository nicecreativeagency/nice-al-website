'use client'

import { useState } from 'react'
import { Clock3, GitCommitHorizontal } from 'lucide-react'

type Version = {
  id: string
  versionNumber: number
  title: string
  createdAt: string
}

type Activity = {
  id: string
  actorName: string
  action: string
  createdAt: string
}

export function ContentHistoryPanel({
  versions,
  activity,
}: {
  versions: Version[]
  activity: Activity[]
}) {
  const [view, setView] = useState<'versions' | 'activity'>('versions')

  return (
    <aside className="contentHistoryPanel">
      <header>
        <div>
          <small>Record</small>
          <h2>History</h2>
        </div>
        <nav aria-label="History view">
          <button
            type="button"
            className={view === 'versions' ? 'active' : ''}
            onClick={() => setView('versions')}
          >
            Versions <span>{versions.length}</span>
          </button>
          <button
            type="button"
            className={view === 'activity' ? 'active' : ''}
            onClick={() => setView('activity')}
          >
            Activity <span>{activity.length}</span>
          </button>
        </nav>
      </header>

      <div className="historyTimeline">
        {view === 'versions'
          ? versions.map((version, index) => (
              <article key={version.id}>
                <i><GitCommitHorizontal size={16} /></i>
                <div>
                  <span>
                    <strong>Version {version.versionNumber}</strong>
                    {index === 0 ? <em>Current</em> : null}
                  </span>
                  <p>{version.title}</p>
                  <time>{new Date(version.createdAt).toLocaleString('en-GB')}</time>
                </div>
              </article>
            ))
          : activity.map((event) => (
              <article key={event.id}>
                <i><Clock3 size={15} /></i>
                <div>
                  <span><strong>{event.actorName}</strong></span>
                  <p>{event.action.replaceAll('.', ' ')}</p>
                  <time>{new Date(event.createdAt).toLocaleString('en-GB')}</time>
                </div>
              </article>
            ))}
      </div>
    </aside>
  )
}
