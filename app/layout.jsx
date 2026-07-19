import './globals.css'

export const metadata = {
  metadataBase: new URL('https://nice.al'),
  title: {
    default: 'NICE.al | Creative Studio',
    template: '%s | NICE.al',
  },
  description:
    'NICE is a two-person creative studio. Since 2017 we build brands, campaigns and products for a short, deliberate list of clients: Iveco, Kia, Sixt, Vodafone, Telekom, Air Jordan.',
  keywords: ['creative studio', 'branding', 'design', 'NICE', 'nice.al', 'Albania', 'Kosovo'],
  authors: [{ name: 'NICE.al' }],
  icons: {
    icon: '/nice-al-symbol.svg',
    shortcut: '/nice-al-symbol.svg',
    apple: '/nice-al-symbol.svg',
  },
  openGraph: {
    title: 'NICE.al | Creative Studio',
    description: 'A two-person creative studio with a nine-year attention span.',
    url: 'https://nice.al',
    siteName: 'NICE.al',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NICE.al | Creative Studio',
    description: 'A two-person creative studio with a nine-year attention span.',
  },
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
