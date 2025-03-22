import { ReactNode } from 'react'

import DashboardLayout from '@/layout/DashboardLayout.component'

type Props = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: Props) {
  return <DashboardLayout>{children}</DashboardLayout>
}
