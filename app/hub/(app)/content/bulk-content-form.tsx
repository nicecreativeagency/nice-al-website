'use client'

import { useRef, useState } from 'react'
import { Archive, CheckSquare2 } from 'lucide-react'
import { bulkContentAction } from '@/app/hub/(app)/content/bulk-actions'

export function BulkContentForm({
  children,
  itemCount,
}: {
  children: React.ReactNode
  itemCount: number
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selected, setSelected] = useState(0)
  const [allSelected, setAllSelected] = useState(false)

  function updateCount() {
    const count =
      formRef.current?.querySelectorAll<HTMLInputElement>(
        'input[name="contentIds"]:checked',
      ).length ?? 0
    setSelected(count)
    setAllSelected(itemCount > 0 && count === itemCount)
  }

  function toggleAll(checked: boolean) {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="contentIds"]')
      .forEach((input) => {
        input.checked = checked
      })
    setSelected(checked ? itemCount : 0)
    setAllSelected(checked)
  }

  return (
    <form
      ref={formRef}
      action={bulkContentAction}
      onChange={updateCount}
      className="bulkContentForm"
    >
      <div className="bulkContentToolbar">
        <label>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          <span>Select all</span>
        </label>
        <strong>{selected} selected</strong>
        <select name="action" defaultValue="send_approval" aria-label="Bulk action">
          <option value="send_approval">Send for approval</option>
          <option value="draft">Return to draft</option>
          <option value="archive">Archive</option>
        </select>
        <button type="submit" disabled={selected === 0}>
          {selected ? <CheckSquare2 size={16} /> : <Archive size={16} />}
          Apply to selected
        </button>
      </div>
      {children}
    </form>
  )
}
