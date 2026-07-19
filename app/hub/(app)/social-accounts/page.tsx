import { Share2 } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function SocialAccountsPage() {
  await requireAdmin()
  return (
    <PlaceholderView
      eyebrow="Publishing connections"
      title="Social Accounts"
      description="Official OAuth connections will be managed here in a later phase."
      icon={Share2}
      milestone="Milestone 5"
    />
  )
}
