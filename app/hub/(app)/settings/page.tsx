import { Settings } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function SettingsPage() {
  await requireAdmin()
  return (
    <PlaceholderView
      eyebrow="Organization controls"
      title="Settings"
      description="Manage workspace defaults, team access and notification rules."
      icon={Settings}
      milestone="Foundation"
    />
  )
}
