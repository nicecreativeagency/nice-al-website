import { FolderOpen } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function MediaPage() {
  await requireAdmin()
  return (
    <PlaceholderView
      eyebrow="Final assets"
      title="Media"
      description="Reusable, publishing-ready images and video for each client."
      icon={FolderOpen}
      milestone="Milestone 2"
    />
  )
}
