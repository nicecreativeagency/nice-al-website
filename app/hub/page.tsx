import { redirect } from 'next/navigation'
import { getViewer } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const viewer = await getViewer()
  redirect(viewer ? '/hub/dashboard' : '/hub/login')
}
