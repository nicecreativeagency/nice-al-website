import { CalendarDays } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function CalendarPage() {
  await requireViewer()
  return (
    <PlaceholderView
      eyebrow="Publishing plan"
      title="Calendar"
      description="A clear month, week and list view of planned content."
      icon={CalendarDays}
      milestone="Milestone 4"
    />
  )
}
