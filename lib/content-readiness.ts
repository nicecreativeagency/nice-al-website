import type { SocialPlatform } from '@/lib/db/schema'

export type ContentReadinessInput = {
  caption: string
  scheduledDate: string | null
  scheduledTime: string | null
  platforms: Array<{ platform: SocialPlatform; caption: string | null }>
  mediaCount: number
}

export function getContentReadiness(input: ContentReadinessInput) {
  const missing: string[] = []

  if (input.mediaCount === 0) missing.push('Creative media')
  if (input.platforms.length === 0) missing.push('Platform')
  if (
    input.platforms.some(
      (target) => !(target.caption?.trim() || input.caption.trim()),
    )
  ) {
    missing.push('Caption')
  }
  if (!input.scheduledDate) missing.push('Publishing date')
  if (!input.scheduledTime) missing.push('Publishing time')

  return {
    ready: missing.length === 0,
    missing,
  }
}
