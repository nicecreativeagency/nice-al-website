import { CheckCircle2 } from 'lucide-react'
import { requireViewer } from '@/lib/dal'
import { PlaceholderView } from '@/app/hub/components/placeholder-view'

export default async function ApprovalsPage() {
  await requireViewer()
  return (
    <PlaceholderView
      eyebrow="Client decisions"
      title="Approvals"
      description="Review, approve or request changes without scattered feedback."
      icon={CheckCircle2}
      milestone="Milestone 3"
    />
  )
}
