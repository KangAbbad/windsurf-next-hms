'use client'

import { AppProgressProvider } from '@bprogress/next'
import { theme } from 'antd'
import { ReactNode } from 'react'

const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const {
    token: { colorPrimary },
  } = theme.useToken()

  return (
    <AppProgressProvider color={colorPrimary} options={{ showSpinner: false }} shallowRouting>
      {children}
    </AppProgressProvider>
  )
}

export default ProgressProvider
