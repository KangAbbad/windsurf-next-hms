'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme, ThemeConfig } from 'antd'
import { Manrope } from 'next/font/google'
import { ReactNode } from 'react'

import { darkModeState } from '@/lib/state/darkMode'

const manrope = Manrope({
  display: 'swap',
  adjustFontFallback: false,
  subsets: ['latin'],
  weight: ['500'],
})

const baseThemeConfig: ThemeConfig = {
  cssVar: true,
  token: {
    fontFamily: `${manrope.style.fontFamily}, sans-serif`,
  },
  components: {
    Table: {
      headerBorderRadius: 0,
    },
  },
}

const lightThemeConfig: ThemeConfig = {
  ...baseThemeConfig,
  algorithm: theme.defaultAlgorithm,
}

const darkThemeConfig: ThemeConfig = {
  ...baseThemeConfig,
  algorithm: theme.darkAlgorithm,
}

type Props = {
  children: ReactNode
}

export const AntdProvider = ({ children }: Props) => {
  const { data: isDarkMode } = darkModeState()

  return (
    <AntdRegistry>
      <ConfigProvider theme={isDarkMode ? darkThemeConfig : lightThemeConfig}>{children}</ConfigProvider>
    </AntdRegistry>
  )
}
