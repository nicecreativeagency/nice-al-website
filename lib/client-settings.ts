export const CLIENT_TIMEZONE_VALUES = [
  'Europe/Belgrade',
  'Europe/Tirane',
  'Europe/Berlin',
  'Europe/London',
  'America/New_York',
] as const

export type ClientTimezone = (typeof CLIENT_TIMEZONE_VALUES)[number]

export const CLIENT_TIMEZONE_OPTIONS: ReadonlyArray<{
  value: ClientTimezone
  label: string
}> = [
  { value: 'Europe/Belgrade', label: 'Republic of Kosova' },
  { value: 'Europe/Tirane', label: 'Albania' },
  { value: 'Europe/Berlin', label: 'Germany' },
  { value: 'Europe/London', label: 'United Kingdom' },
  { value: 'America/New_York', label: 'New York' },
]

export function getClientTimezoneLabel(timezone: string) {
  return (
    CLIENT_TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ??
    timezone
  )
}
