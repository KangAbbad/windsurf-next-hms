import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AntdProvider } from '@/providers/AntdProvider'
import { TanstackQueryProvider } from '@/providers/TanstackQueryProvider'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hotel Management System',
  description: 'Manage your hotel easily with our system. Book rooms, manage reservations, and more.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TanstackQueryProvider>
          <AntdProvider>{children}</AntdProvider>
        </TanstackQueryProvider>
      </body>
    </html>
  )
}
