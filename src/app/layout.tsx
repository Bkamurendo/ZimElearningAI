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
  title: 'ZimLearn — ZIMSEC E-Learning Platform',
  description: 'AI-powered e-learning for Zimbabwe. Study ZIMSEC Primary, O-Level and A-Level with an AI teacher, past papers, quizzes and more.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'ZimLearn — ZIMSEC E-Learning Platform',
    description: 'AI-powered e-learning for Zimbabwe. Study ZIMSEC Primary, O-Level and A-Level with an AI teacher, past papers, quizzes and more.',
    url: siteUrl,
    siteName: 'ZimLearn',
    locale: 'en_ZW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZimLearn — ZIMSEC E-Learning Platform',
    description: 'AI-powered e-learning for Zimbabwe. Study with an AI teacher, past papers and quizzes.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerRegistration />
        <OfflineBanner />
        <ThemeProvider>{children}</ThemeProvider>
        <UpgradePopup />
      </body>
    </html>
  )
}
