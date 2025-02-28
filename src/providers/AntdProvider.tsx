'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme } from 'antd'
import { Manrope } from 'next/font/google'
import { ReactNode } from 'react'

import { darkModeState } from '@/lib/state/darkMode'

const manrope = Manrope({
  display: 'swap',
  adjustFontFallback: false,
  subsets: ['latin'],
  weight: ['500'],
})

type Props = {
  children: ReactNode
}

export const AntdProvider = ({ children }: Props) => {
  const { data: isDarkMode } = darkModeState()

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          cssVar: true,
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            fontFamily: `${manrope.style.fontFamily}, sans-serif`,
          },
          components: {
            Table: {
              headerBorderRadius: 0,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}
