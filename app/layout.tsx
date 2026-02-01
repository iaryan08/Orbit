import React from "react"
import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'MoonBetweenUs',
  description: 'A private space for couples to share love, memories, and moments together',
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
import BackgroundHearts from '@/components/background-hearts'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${_outfit.variable} ${_cormorant.variable} ${_pinyon.variable} font-sans antialiased min-h-screen relative overflow-x-hidden`}>
        <RomanticBackground />
        <BackgroundHearts />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
