import { eq, inArray } from 'drizzle-orm'
import { CheckCircle2, Mail, ShieldCheck, UsersRound } from 'lucide-react'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  clientMember,
  organizationMember,
  user,
  type Role,
} from '@/lib/db/schema'
import { PageHeader } from '@/app/hub/components/page-header'
import {
  MemberAccessCard,
  NewMemberDialog,
} from '@/app/hub/(app)/settings/member-management'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const viewer = await requireAdmin()
  const params = await searchParams
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: organizationMember.role,
      createdAt: organizationMember.createdAt,
    })
    .from(organizationMember)
    .innerJoin(user, eq(user.id, organizationMember.userId))
    .where(eq(organizationMember.organizationId, viewer.organization.id))

  const clientIds = viewer.clients.map((item) => item.id)
  const assignments = clientIds.length
    ? await db
        .select({
          userId: clientMember.userId,
          clientId: clientMember.clientId,
        })
        .from(clientMember)
        .where(inArray(clientMember.clientId, clientIds))
    : []
  const assignmentsByUser = assignments.reduce((map, assignment) => {
    const existing = map.get(assignment.userId) ?? []
    existing.push(assignment.clientId)
    map.set(assignment.userId, existing)
    return map
  }, new Map<string, string[]>())
  const members = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    createdAt: row.createdAt.toISOString(),
    clientIds: assignmentsByUser.get(row.id) ?? [],
  }))

  return (
    <div className="hubPage">
      <PageHeader
        eyebrow="Organization controls"
        title="Settings"
        description="Create accounts, assign client access and manage workspace security."
        action={
          <NewMemberDialog
            clients={viewer.clients}
            canCreateSuperAdmin={viewer.role === 'super_admin'}
          />
        }
      />

      {params.created && (
        <div className="clientSuccess">
          <CheckCircle2 size={17} />
          {params.created} can now sign in.
          {params.email === 'skipped' ? ' Email delivery is not configured yet.' : ''}
        </div>
      )}
      {(params.updated || params.password || params.revoked) && (
        <div className="clientSuccess">
          <CheckCircle2 size={17} />
          Workspace access was updated.
        </div>
      )}
      {params.error && (
        <div className="accessNotice">
          That security change could not be completed. Check the role, password
          and client assignment.
        </div>
      )}

      <section className="settingsSummary">
        <article>
          <UsersRound size={20} />
          <span><strong>{members.length}</strong><small>Active members</small></span>
        </article>
        <article>
          <ShieldCheck size={20} />
          <span><strong>Server enforced</strong><small>Role and client access</small></span>
        </article>
        <article>
          <Mail size={20} />
          <span>
            <strong>{process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? 'Connected' : 'Not configured'}</strong>
            <small>Email notifications</small>
          </span>
        </article>
      </section>

      <section className="settingsMembers">
        <header>
          <div>
            <p>Team and clients</p>
            <h2>Workspace access</h2>
          </div>
          <span>{members.length} accounts</span>
        </header>
        <div className="settingsMemberGrid">
          {members.map((member) => (
            <MemberAccessCard
              key={member.id}
              member={member}
              clients={viewer.clients}
              currentUserId={viewer.user.id}
              canCreateSuperAdmin={viewer.role === 'super_admin'}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
