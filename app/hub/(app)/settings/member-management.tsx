'use client'

import { useActionState, useRef } from 'react'
import { KeyRound, Plus, ShieldCheck, UserMinus, X } from 'lucide-react'
import {
  createMemberAction,
  resetMemberPasswordAction,
  revokeMemberAccessAction,
  updateMemberAccessAction,
  type CreateMemberState,
} from '@/app/hub/(app)/settings/actions'
import type { Role } from '@/lib/db/schema'

type ClientOption = {
  id: string
  name: string
  brandColor: string
}

type Member = {
  id: string
  name: string
  email: string
  role: Role
  clientIds: string[]
  createdAt: string
}

const initialState: CreateMemberState = {}
const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  organization_admin: 'Organization Admin',
  team_member: 'Team Member',
  client: 'Client',
}

export function NewMemberDialog({
  clients,
  canCreateSuperAdmin,
}: {
  clients: ClientOption[]
  canCreateSuperAdmin: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, isPending] = useActionState(
    createMemberAction,
    initialState,
  )

  return (
    <>
      <button
        className="hubPrimaryButton"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Plus size={17} /> Add member
      </button>
      <dialog className="memberDialog" ref={dialogRef}>
        <header>
          <div>
            <p>Workspace access</p>
            <h2>Create an account</h2>
          </div>
          <form method="dialog">
            <button aria-label="Close dialog"><X size={19} /></button>
          </form>
        </header>
        <form className="memberCreateForm" action={formAction}>
          <div className="memberFormSplit">
            <label>
              <span>Full name</span>
              <input name="name" required autoFocus />
              {state.fields?.name?.[0] && <small>{state.fields.name[0]}</small>}
            </label>
            <label>
              <span>Email address</span>
              <input name="email" type="email" required autoComplete="off" />
              {state.fields?.email?.[0] && <small>{state.fields.email[0]}</small>}
            </label>
          </div>
          <div className="memberFormSplit">
            <label>
              <span>Temporary password</span>
              <input
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
              />
              <em>At least 12 characters. Share it securely.</em>
            </label>
            <label>
              <span>Role</span>
              <select name="role" defaultValue="client">
                {canCreateSuperAdmin && (
                  <option value="super_admin">Super Admin</option>
                )}
                <option value="organization_admin">Organization Admin</option>
                <option value="team_member">Team Member</option>
                <option value="client">Client</option>
              </select>
            </label>
          </div>
          <fieldset className="memberClientChoices">
            <legend>Client workspaces</legend>
            <p>Required for client users. Optional for internal team members.</p>
            <div>
              {clients.map((client) => (
                <label key={client.id}>
                  <input type="checkbox" name="clientIds" value={client.id} />
                  <i style={{ backgroundColor: client.brandColor }} />
                  <span>{client.name}</span>
                </label>
              ))}
            </div>
            {state.fields?.clientIds?.[0] && (
              <small>{state.fields.clientIds[0]}</small>
            )}
          </fieldset>
          {state.error && <p className="memberFormError">{state.error}</p>}
          <footer>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create account'}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  )
}

export function MemberAccessCard({
  member,
  clients,
  currentUserId,
  canCreateSuperAdmin,
}: {
  member: Member
  clients: ClientOption[]
  currentUserId: string
  canCreateSuperAdmin: boolean
}) {
  const isCurrentUser = member.id === currentUserId
  const isProtectedSuperAdmin =
    member.role === 'super_admin' && !canCreateSuperAdmin
  const accessFormDisabled = isCurrentUser || isProtectedSuperAdmin

  return (
    <article className="memberAccessCard">
      <header>
        <span>{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
        <div>
          <strong>{member.name}</strong>
          <small>{member.email}</small>
        </div>
        <em>{roleLabels[member.role]}</em>
      </header>

      <form className="memberAccessForm" action={updateMemberAccessAction}>
        <input type="hidden" name="userId" value={member.id} />
        <label>
          <span>Role</span>
          <select
            name="role"
            defaultValue={member.role}
            disabled={accessFormDisabled}
          >
            {(canCreateSuperAdmin || member.role === 'super_admin') && (
              <option value="super_admin">Super Admin</option>
            )}
            <option value="organization_admin">Organization Admin</option>
            <option value="team_member">Team Member</option>
            <option value="client">Client</option>
          </select>
          {accessFormDisabled && (
            <input type="hidden" name="role" value={member.role} />
          )}
        </label>
        <fieldset>
          <legend>Workspace access</legend>
          <div>
            {clients.map((client) => (
              <label key={client.id}>
                <input
                  type="checkbox"
                  name="clientIds"
                  value={client.id}
                  defaultChecked={member.clientIds.includes(client.id)}
                  disabled={isProtectedSuperAdmin}
                />
                <span>{client.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={isProtectedSuperAdmin}>
          <ShieldCheck size={16} /> Save access
        </button>
      </form>

      <details className="memberSecurity">
        <summary>Security actions</summary>
        <form action={resetMemberPasswordAction}>
          <input type="hidden" name="userId" value={member.id} />
          <label>
            <span>New temporary password</span>
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit"><KeyRound size={15} /> Reset password</button>
        </form>
        {!isCurrentUser && (
          <form action={revokeMemberAccessAction}>
            <input type="hidden" name="userId" value={member.id} />
            <label className="memberRevokeConfirm">
              <input name="confirm" type="checkbox" value="yes" required />
              <span>I understand this removes workspace access</span>
            </label>
            <button className="memberRevokeButton" type="submit">
              <UserMinus size={15} /> Revoke workspace access
            </button>
          </form>
        )}
      </details>
    </article>
  )
}
