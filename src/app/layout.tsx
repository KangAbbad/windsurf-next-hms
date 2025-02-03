import type { Metadata } from 'next'

import { AntdProvider } from '@/providers/AntdProvider'
import { TanstackQueryProvider } from '@/providers/TanstackQueryProvider'

import './globals.css'

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
      <body>
        <TanstackQueryProvider>
          <AntdProvider>{children}</AntdProvider>
        </TanstackQueryProvider>
      </body>
    </html>
  )
}
