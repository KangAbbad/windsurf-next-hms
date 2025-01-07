import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const AntdProvider = ({ children }: Props) => {
  return <AntdRegistry>{children}</AntdRegistry>
}
