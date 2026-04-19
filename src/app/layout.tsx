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
  title: "ZimLearn AI — Zimbabwe's AI Teacher for ZIMSEC & the Heritage-Based Curriculum",
  description: "Meet MaFundi, the AI teacher trained on Zimbabwe's Heritage-Based Curriculum and the full ZIMSEC syllabus. Adaptive tutoring, past papers with instant marking, and exam-ready study plans for ECD, Primary, O'Level and A'Level learners.",
  keywords: "ZIMSEC, Heritage-Based Curriculum, Zimbabwe e-learning, AI tutor Zimbabwe, O'Level past papers, A'Level tutor, ZimLearn, MaFundi",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "ZimLearn AI — Zimbabwe's AI Teacher",
    description: "An AI teacher trained on ZIMSEC and Zimbabwe's Heritage-Based Curriculum. Study any subject, practise past papers, and get instant feedback — 24/7.",
    url: siteUrl,
    siteName: 'ZimLearn AI',
    locale: 'en_ZW',
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.png` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ZimLearn AI — Zimbabwe's AI Teacher",
    description: "MaFundi: an AI teacher trained on ZIMSEC and the Heritage-Based Curriculum. Built for Zimbabwean learners.",
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
