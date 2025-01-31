import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const AntdProvider = ({ children }: Props) => {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
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
