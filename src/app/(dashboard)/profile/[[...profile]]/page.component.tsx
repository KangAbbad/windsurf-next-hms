'use client'

import { UserProfile } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

import { darkModeState } from '@/lib/state/darkMode'

export default function ProfilePage() {
  const { data: isDarkMode } = darkModeState()

  return (
    <main className="p-4">
      <div className="pb-0 rounded-lg bg-ant-color-container">
        <UserProfile
          appearance={{
            baseTheme: isDarkMode ? dark : undefined,
            elements: {
              rootBox: {
                width: '100%',
              },
              cardBox: {
                width: '100%',
              },
            },
          }}
        />
      </div>
    </main>
  )
}
