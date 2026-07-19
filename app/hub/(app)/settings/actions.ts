'use server'

import { hashPassword } from 'better-auth/crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { recordActivity } from '@/lib/activity'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  account,
  client,
  clientMember,
  organizationMember,
  session,
  user,
  type Role,
} from '@/lib/db/schema'
import { sendAccountReadyEmail } from '@/lib/email'

const roleValues = [
  'super_admin',
  'organization_admin',
  'team_member',
  'client',
] as const

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
  role: z.enum(roleValues),
  clientIds: z.array(z.string()),
})

export type CreateMemberState = {
  error?: string
  fields?: Record<string, string[]>
}

async function validateClientIds(organizationId: string, clientIds: string[]) {
  const uniqueIds = Array.from(new Set(clientIds))
  if (!uniqueIds.length) return []

  const rows = await db
    .select({ id: client.id })
    .from(client)
    .where(eq(client.organizationId, organizationId))

  const allowed = new Set(rows.map((row) => row.id))
  return uniqueIds.filter((id) => allowed.has(id))
}

async function removeOrganizationClientAccess(
  organizationId: string,
  userId: string,
) {
  const rows = await db
    .select({ id: client.id })
    .from(client)
    .where(eq(client.organizationId, organizationId))
  const ids = rows.map((row) => row.id)
  if (!ids.length) return

  await db
    .delete(clientMember)
    .where(
      and(
        eq(clientMember.userId, userId),
        inArray(clientMember.clientId, ids),
      ),
    )
}

function canAssignRole(viewerRole: Role, role: Role) {
  return role !== 'super_admin' || viewerRole === 'super_admin'
}

export async function createMemberAction(
  _state: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const viewer = await requireAdmin()
  const parsed = memberSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    clientIds: formData.getAll('clientIds'),
  })
  if (!parsed.success) {
    return {
      error: 'Check the account information and try again.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }
  if (!canAssignRole(viewer.role, parsed.data.role)) {
    return { error: 'Only a Super Admin can create another Super Admin.' }
  }

  const assignedClientIds = await validateClientIds(
    viewer.organization.id,
    parsed.data.clientIds,
  )
  if (parsed.data.role === 'client' && assignedClientIds.length === 0) {
    return {
      error: 'Assign a client user to at least one client workspace.',
      fields: { clientIds: ['Choose at least one client.'] },
    }
  }

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, parsed.data.email))
    .limit(1)
  if (existingUser) {
    return {
      error: 'An account with this email already exists.',
      fields: { email: ['Use a different email address.'] },
    }
  }

  const userId = crypto.randomUUID()
  try {
    const password = await hashPassword(parsed.data.password)
    await db.insert(user).values({
      id: userId,
      name: parsed.data.name,
      email: parsed.data.email,
      emailVerified: true,
    })
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password,
    })
    await db.insert(organizationMember).values({
      id: crypto.randomUUID(),
      organizationId: viewer.organization.id,
      userId,
      role: parsed.data.role,
    })
    if (assignedClientIds.length) {
      await db.insert(clientMember).values(
        assignedClientIds.map((clientId) => ({
          id: crypto.randomUUID(),
          clientId,
          userId,
          role: parsed.data.role === 'client' ? 'client' : 'member',
        })),
      )
    }
    await recordActivity({
      organizationId: viewer.organization.id,
      actor: { id: viewer.user.id, name: viewer.user.name },
      action: 'member.created',
      metadata: {
        memberUserId: userId,
        memberName: parsed.data.name,
        role: parsed.data.role,
      },
    })
  } catch (error) {
    await db.delete(user).where(eq(user.id, userId)).catch(() => undefined)
    console.error('Failed to create member account', error)
    return { error: 'The account could not be created. Please try again.' }
  }

  const delivery = await sendAccountReadyEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    organizationName: viewer.organization.name,
  })
  if (delivery.status === 'failed') {
    console.error('Account email delivery failed', delivery.error)
  }

  revalidatePath('/hub/settings')
  redirect(
    `/hub/settings?created=${encodeURIComponent(parsed.data.name)}&email=${delivery.status}`,
  )
}

const accessSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(roleValues),
  clientIds: z.array(z.string()),
})

export async function updateMemberAccessAction(formData: FormData) {
  const viewer = await requireAdmin()
  const parsed = accessSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
    clientIds: formData.getAll('clientIds'),
  })
  if (!parsed.success) redirect('/hub/settings?error=invalid-access')
  if (!canAssignRole(viewer.role, parsed.data.role)) {
    redirect('/hub/settings?error=super-admin-required')
  }
  if (
    parsed.data.userId === viewer.user.id &&
    parsed.data.role !== viewer.role
  ) {
    redirect('/hub/settings?error=self-role')
  }

  const [membership] = await db
    .select({
      id: organizationMember.id,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, viewer.organization.id),
        eq(organizationMember.userId, parsed.data.userId),
      ),
    )
    .limit(1)
  if (!membership) redirect('/hub/settings?error=member-not-found')
  if (
    membership.role === 'super_admin' &&
    viewer.role !== 'super_admin'
  ) {
    redirect('/hub/settings?error=super-admin-required')
  }

  const assignedClientIds = await validateClientIds(
    viewer.organization.id,
    parsed.data.clientIds,
  )
  if (parsed.data.role === 'client' && assignedClientIds.length === 0) {
    redirect('/hub/settings?error=client-required')
  }

  await db
    .update(organizationMember)
    .set({ role: parsed.data.role })
    .where(eq(organizationMember.id, membership.id))
  await removeOrganizationClientAccess(
    viewer.organization.id,
    parsed.data.userId,
  )
  if (assignedClientIds.length) {
    await db.insert(clientMember).values(
      assignedClientIds.map((clientId) => ({
        id: crypto.randomUUID(),
        clientId,
        userId: parsed.data.userId,
        role: parsed.data.role === 'client' ? 'client' : 'member',
      })),
    )
  }
  await db.delete(session).where(eq(session.userId, parsed.data.userId))
  await recordActivity({
    organizationId: viewer.organization.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'member.access_updated',
    metadata: {
      memberUserId: parsed.data.userId,
      role: parsed.data.role,
      clientIds: assignedClientIds.join(','),
    },
  })
  revalidatePath('/hub/settings')
  redirect('/hub/settings?updated=1')
}

const passwordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(12).max(128),
})

export async function resetMemberPasswordAction(formData: FormData) {
  const viewer = await requireAdmin()
  const parsed = passwordSchema.safeParse({
    userId: formData.get('userId'),
    password: formData.get('password'),
  })
  if (!parsed.success) redirect('/hub/settings?error=password')

  const [membership] = await db
    .select({
      id: organizationMember.id,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, viewer.organization.id),
        eq(organizationMember.userId, parsed.data.userId),
      ),
    )
    .limit(1)
  if (!membership) redirect('/hub/settings?error=member-not-found')
  if (
    membership.role === 'super_admin' &&
    viewer.role !== 'super_admin'
  ) {
    redirect('/hub/settings?error=super-admin-required')
  }

  const password = await hashPassword(parsed.data.password)
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, parsed.data.userId),
        eq(account.providerId, 'credential'),
      ),
    )
    .limit(1)
  if (credential) {
    await db
      .update(account)
      .set({ password })
      .where(eq(account.id, credential.id))
  } else {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: parsed.data.userId,
      providerId: 'credential',
      userId: parsed.data.userId,
      password,
    })
  }
  await db.delete(session).where(eq(session.userId, parsed.data.userId))
  await recordActivity({
    organizationId: viewer.organization.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'member.password_reset',
    metadata: { memberUserId: parsed.data.userId },
  })
  revalidatePath('/hub/settings')
  redirect('/hub/settings?password=1')
}

export async function revokeMemberAccessAction(formData: FormData) {
  const viewer = await requireAdmin()
  const userId = z.string().uuid().safeParse(formData.get('userId'))
  if (
    !userId.success ||
    userId.data === viewer.user.id ||
    formData.get('confirm') !== 'yes'
  ) {
    redirect('/hub/settings?error=self-revoke')
  }

  const [membership] = await db
    .select({
      id: organizationMember.id,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, viewer.organization.id),
        eq(organizationMember.userId, userId.data),
      ),
    )
    .limit(1)
  if (!membership) redirect('/hub/settings?error=member-not-found')
  if (
    membership.role === 'super_admin' &&
    viewer.role !== 'super_admin'
  ) {
    redirect('/hub/settings?error=super-admin-required')
  }

  await removeOrganizationClientAccess(viewer.organization.id, userId.data)
  await db
    .delete(organizationMember)
    .where(eq(organizationMember.id, membership.id))
  await db.delete(session).where(eq(session.userId, userId.data))
  await recordActivity({
    organizationId: viewer.organization.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'member.access_revoked',
    metadata: { memberUserId: userId.data },
  })
  revalidatePath('/hub/settings')
  redirect('/hub/settings?revoked=1')
}
