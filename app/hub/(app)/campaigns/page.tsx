import { Megaphone } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function CampaignsPage() {
  await requireAdmin()
  return (
    <PlaceholderView
      eyebrow="Grouped work"
      title="Campaigns"
      description="Keep related posts, dates and approval progress together."
      icon={Megaphone}
      milestone="Milestone 2"
    />
  )
}
