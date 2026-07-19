'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { CLIENT_TIMEZONE_VALUES } from '@/lib/client-settings'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { client } from '@/lib/db/schema'

const updateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a client name.')
    .max(80, 'Keep the client name under 80 characters.'),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Enter a valid six-digit HEX color.'),
  timezone: z.enum(CLIENT_TIMEZONE_VALUES),
})

export type UpdateClientState = {
  error?: string
  fields?: {
    name?: string[]
    brandColor?: string[]
    timezone?: string[]
  }
}

export async function updateClientAction(
  clientId: string,
  _state: UpdateClientState,
  formData: FormData,
): Promise<UpdateClientState> {
  const viewer = await requireAdmin()
  const parsed = updateClientSchema.safeParse({
    name: formData.get('name'),
    brandColor: formData.get('brandColor'),
    timezone: formData.get('timezone'),
  })

  if (!parsed.success) {
    return {
      error: 'Check the highlighted information and try again.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const updated = await db
    .update(client)
    .set({
      name: parsed.data.name,
      brandColor: parsed.data.brandColor.toLowerCase(),
      timezone: parsed.data.timezone,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(client.id, clientId),
        eq(client.organizationId, viewer.organization.id),
      ),
    )
    .returning()

  if (!updated[0]) {
    return { error: 'This client could not be found in your organization.' }
  }

  revalidatePath('/hub/clients')
  revalidatePath(`/hub/clients/${clientId}`)
  redirect(`/hub/clients/${clientId}?saved=1`)
}
