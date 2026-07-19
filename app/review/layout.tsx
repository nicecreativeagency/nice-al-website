import type { Metadata } from 'next'
import '@/app/hub/hub.css'

export const metadata: Metadata = {
  title: 'Content Review · NICE',
  robots: { index: false, follow: false, noarchive: true },
}

export default function ReviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="hub-scope guestReviewScope">{children}</div>
}
