import type { Metadata } from 'next'
import './hub.css'

export const metadata: Metadata = {
  title: 'Social Hub',
  description: 'Content operations and client collaboration by NICE.',
}

export default function HubRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="hub-scope">{children}</div>
}
