import type {
  ContentStatus,
  ContentType,
  SocialPlatform,
} from '@/lib/db/schema'

export const CONTENT_TYPE_VALUES = [
  'image_post',
  'carousel',
  'video',
  'reel',
  'story',
] as const satisfies ReadonlyArray<ContentType>

export const CONTENT_TYPE_OPTIONS: ReadonlyArray<{
  value: ContentType
  label: string
}> = [
  { value: 'image_post', label: 'Image post' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'video', label: 'Video' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
]

export const SOCIAL_PLATFORM_VALUES = [
  'facebook',
  'instagram',
  'linkedin',
] as const satisfies ReadonlyArray<SocialPlatform>

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Draft',
  waiting_approval: 'Waiting for approval',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  ready_to_schedule: 'Ready to schedule',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
  archived: 'Archived',
}

export function getContentTypeLabel(contentType: string) {
  return (
    CONTENT_TYPE_OPTIONS.find((option) => option.value === contentType)?.label ??
    contentType
  )
}
