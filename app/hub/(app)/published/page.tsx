import { Archive } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function PublishedPage() {
  await requireViewer()
  return (
    <PlaceholderView
      eyebrow="Content history"
      title="Published"
      description="A record of approved content that has gone live."
      icon={Archive}
      milestone="Milestone 6"
    />
  )
}
