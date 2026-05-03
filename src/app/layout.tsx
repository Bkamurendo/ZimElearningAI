import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineBanner } from '@/components/OfflineBanner'
import { UpgradePopup } from '@/components/UpgradePopup'


const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zim-elearning-ai.vercel.app'

export const metadata: Metadata = {
  title: 'ZimLearn AI — The Official ZIMSEC AI Teacher & Learning Platform',
  description: 'Zimbabwe\'s most advanced AI-powered e-learning platform. Dedicated ZIMSEC curriculum alignment for Primary, O-Level, and A-Level. Complete with AI Teacher MaFundi, past papers, and study planners.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'ZimLearn AI — The Official ZIMSEC AI Teacher',
    description: 'Master your ZIMSEC exams with the original AI-powered learning platform for Zimbabwe. Official Heritage-Based Curriculum alignment.',
    url: siteUrl,
    siteName: 'ZimLearn AI Official',
    locale: 'en_ZW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZimLearn AI — Official ZIMSEC AI Teacher',
    description: 'The premier AI e-learning destination for Zimbabwean students.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

import { UpgradePopup } from '@/components/UpgradePopup'
import MobileNavbar from '@/components/MobileNavbar'

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d9488" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-teal-100 selection:text-teal-900`}>
        <ServiceWorkerRegistration />
        <OfflineBanner />
        <ThemeProvider>
          <div className="pb-24 lg:pb-0">
            {children}
          </div>
        </ThemeProvider>
        <UpgradePopup />
        <MobileNavbar />
      </body>
    </html>
  )
}
