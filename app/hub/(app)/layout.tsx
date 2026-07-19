import { requireViewer } from '@/lib/dal'
import { HubShell } from '@/app/hub/components/hub-shell'

export const dynamic = 'force-dynamic'

export default async function AuthenticatedHubLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await requireViewer()
  return <HubShell viewer={viewer}>{children}</HubShell>
}
