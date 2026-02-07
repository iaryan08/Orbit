import React from "react"
import type { Metadata, Viewport } from 'next'
import { Outfit, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const _cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic']
});

import { Pinyon_Script } from 'next/font/google';
const _pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon",
});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Orbit',
  description: 'A private space for couples to share love, memories, and moments together',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/favicon-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

import { RomanticBackground } from '@/components/romantic-background'
import { ScrollManager } from '@/components/scroll-manager'

import PushNotificationManager from '@/components/PushNotificationManager'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side randomization for performance
  const bgIds = ["1", "2", "3", "4"];
  const randomId = bgIds[Math.floor(Math.random() * bgIds.length)];
  const initialImage = `/images/${randomId}.jpg`;

  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body suppressHydrationWarning className={`${_outfit.variable} ${_cormorant.variable} ${_pinyon.variable} font-sans antialiased min-h-screen relative overflow-x-hidden`}>
        <ScrollManager />
        <RomanticBackground initialImage={initialImage} />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster />
        <PushNotificationManager />
        <Analytics />
      </body>
    </html>
  )
}
