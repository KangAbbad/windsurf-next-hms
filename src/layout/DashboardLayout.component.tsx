'use client'

import { Button, Layout, Menu, theme } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { Content, Header } from 'antd/es/layout/layout'
import { useState } from 'react'
import { RiMenuFold2Fill, RiMenuUnfold2Fill } from 'react-icons/ri'

import { dashboardMenuList } from './DashboardLayout.menu'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout className={styles.container}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['homepage']} items={dashboardMenuList} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <RiMenuUnfold2Fill /> : <RiMenuFold2Fill />}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
