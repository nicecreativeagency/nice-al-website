'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { recordActivity } from '@/lib/activity'
import { requireAdmin } from '@/lib/dal'
import { db } from '@/lib/db'
import { campaign, client } from '@/lib/db/schema'

const campaignSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Choose a client.'),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(3000),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be after the start date.',
      })
    }
  })

export type CampaignFormState = {
  error?: string
  fields?: Record<string, string[]>
}

async function getOwnedClient(clientId: string, organizationId: string) {
  const [ownedClient] = await db
    .select({ id: client.id })
    .from(client)
    .where(
      and(
        eq(client.id, clientId),
        eq(client.organizationId, organizationId),
      ),
    )
    .limit(1)
  return ownedClient
}

export async function createCampaignAction(
  _state: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const viewer = await requireAdmin()
  const parsed = campaignSchema.safeParse({
    clientId: formData.get('clientId'),
    name: formData.get('name'),
    description: formData.get('description'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Check the campaign information.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const ownedClient = await getOwnedClient(
    parsed.data.clientId,
    viewer.organization.id,
  )
  if (!ownedClient) return { error: 'Choose a valid client.' }

  const campaignId = crypto.randomUUID()
  await db.insert(campaign).values({
    id: campaignId,
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    createdByUserId: viewer.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  })

  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'campaign.created',
    metadata: { campaignId, campaignName: parsed.data.name },
  })

  revalidatePath('/hub/campaigns')
  redirect(`/hub/campaigns/${campaignId}?created=1`)
}

export async function updateCampaignAction(
  campaignId: string,
  _state: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const viewer = await requireAdmin()
  const parsed = campaignSchema.safeParse({
    clientId: formData.get('clientId'),
    name: formData.get('name'),
    description: formData.get('description'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
  })

  if (!parsed.success) {
    return {
      error: 'Check the campaign information.',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  const ownedClient = await getOwnedClient(
    parsed.data.clientId,
    viewer.organization.id,
  )
  if (!ownedClient) return { error: 'Choose a valid client.' }

  const updated = await db
    .update(campaign)
    .set({
      clientId: ownedClient.id,
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(campaign.id, campaignId),
        eq(campaign.organizationId, viewer.organization.id),
      ),
    )
    .returning()

  if (!updated[0]) return { error: 'Campaign not found.' }

  await recordActivity({
    organizationId: viewer.organization.id,
    clientId: ownedClient.id,
    actor: { id: viewer.user.id, name: viewer.user.name },
    action: 'campaign.updated',
    metadata: { campaignId, campaignName: parsed.data.name },
  })

  revalidatePath('/hub/campaigns')
  revalidatePath(`/hub/campaigns/${campaignId}`)
  redirect(`/hub/campaigns/${campaignId}?saved=1`)
}
