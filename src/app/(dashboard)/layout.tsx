import DashboardLayout from '@/layout/DashboardLayout.component'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <DashboardLayout>{children}</DashboardLayout>
}
