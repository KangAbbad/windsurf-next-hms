import { ClerkProvider } from '@clerk/nextjs'
import { dark as clerkThemesDark } from '@clerk/themes'
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
  const isDarkMode = currentTheme === 'dark'
  queryClient.setQueryData([queryKeyDarkMode], isDarkMode)

  return (
    <html lang="en" data-theme={currentTheme}>
      <body>
        <ClerkProvider appearance={{ baseTheme: isDarkMode ? clerkThemesDark : undefined }}>
          <TanstackQueryProvider>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <AntdProvider>
                <ProgressProvider>{children}</ProgressProvider>
              </AntdProvider>
            </HydrationBoundary>
          </TanstackQueryProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
