import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import type { Metadata } from 'next'

import { queryKeyDarkMode } from '@/lib/constants'
import { AntdProvider } from '@/providers/AntdProvider'
import ProgressProvider from '@/providers/ProgressProvider'
import { TanstackQueryProvider } from '@/providers/TanstackQueryProvider'
import { getTheme } from '@/server-actions/theme'

import './globals.css'

export const metadata: Metadata = {
  title: 'Hotel Management System',
  description: 'Manage your hotel easily with our system. Book rooms, manage reservations, and more.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const queryClient = new QueryClient()

  const currentTheme = await getTheme()
  queryClient.setQueryData([queryKeyDarkMode], currentTheme === 'dark')

  return (
    <html lang="en" data-theme={currentTheme}>
      <body>
        <TanstackQueryProvider>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <AntdProvider>
              <ProgressProvider>{children}</ProgressProvider>
            </AntdProvider>
          </HydrationBoundary>
        </TanstackQueryProvider>
      </body>
    </html>
  )
}
