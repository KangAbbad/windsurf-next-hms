import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { Manrope } from 'next/font/google'
import { ReactNode } from 'react'

const prompt = Manrope({
  subsets: ['latin'],
  weight: ['500'],
})

type Props = {
  children: ReactNode
}

export const AntdProvider = ({ children }: Props) => {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          cssVar: true,
          token: {
            fontFamily: `${prompt.style.fontFamily}, sans-serif`,
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
