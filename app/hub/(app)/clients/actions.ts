'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { client } from '@/lib/db/schema'
import { CLIENT_TIMEZONE_VALUES } from '@/lib/client-settings'

const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a client name.')
    .max(80, 'Keep the client name under 80 characters.'),
  slug: z
    .string()
    .trim()
    .max(80, 'Keep the workspace slug under 80 characters.')
    .optional(),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid brand color.'),
  timezone: z.enum(CLIENT_TIMEZONE_VALUES),
})

export type CreateClientState = {
  error?: string
  fields?: {
    name?: string[]
    slug?: string[]
    brandColor?: string[]
    timezone?: string[]
  }
}

function createSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createClientAction(
  _state: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const viewer = await requireAdmin()
  const parsed = createClientSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    brandColor: formData.get('brandColor'),
    timezone: formData.get('timezone'),
  })

  if (!parsed.success) {
    return {
      error: 'Check the highlighted information and try again.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const slug = createSlug(parsed.data.slug || parsed.data.name)
  if (slug.length < 2) {
    return {
      error: 'Choose a workspace slug with at least two letters or numbers.',
      fields: { slug: ['Enter a valid workspace slug.'] },
    }
  }

  try {
    await db.insert(client).values({
      id: crypto.randomUUID(),
      organizationId: viewer.organization.id,
      name: parsed.data.name,
      slug,
      brandColor: parsed.data.brandColor.toLowerCase(),
      timezone: parsed.data.timezone,
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      return {
        error: 'A client with this workspace slug already exists.',
        fields: { slug: ['Choose a different workspace slug.'] },
      }
    }

    console.error('Failed to create client', error)
    return { error: 'The client could not be created. Please try again.' }
  }

  revalidatePath('/hub/clients')
  redirect(`/hub/clients?created=${encodeURIComponent(parsed.data.name)}`)
}
