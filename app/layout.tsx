import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Audio Tester Tool - Game Development',
  description: 'Professional web-based audio testing tool for game developers and sound engineers. Test BGM, SFX, spatial audio, and audio effects with full Web Audio API support.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0b1220" />
      </head>
      <body className={`font-sans antialiased`}>
        <a href="#main" className="skip-link sr-only focus:not-sr-only absolute left-2 top-2 z-50 px-3 py-2 rounded bg-primary text-primary-foreground">Skip to content</a>
        {children}
        <Toaster />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
