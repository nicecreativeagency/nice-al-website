import { FileStack } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function ContentPage() {
  await requireAdmin()
  return (
    <PlaceholderView
      eyebrow="Content operations"
      title="Content"
      description="Create, version and prepare social content for every channel."
      icon={FileStack}
      milestone="Milestone 2"
    />
  )
}
