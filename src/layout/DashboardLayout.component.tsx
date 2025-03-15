'use client'

import { UserButton } from '@clerk/nextjs'
import { Breadcrumb, Button, Col, Flex, Layout, Menu, MenuProps, message, Modal, notification, Row } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai'

import { dashboardMenuList } from './DashboardLayout.menu'
import styles from './DashboardLayout.module.css'

import DarkModeButton from '@/components/DarkModeButton'
import { useBreadcrumbs } from '@/hooks/utils/useBreadcrumb'
import { AntdContextHolder } from '@/lib/context/AntdContextHolder'
import { createGlobalState } from '@/utils/createGlobalState'

type Props = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname()
  const defaultParentKey = [`/${pathname.split('/')[1]}`]
  const defaultSelectedKeys = pathname.split('/').length > 2 ? [pathname] : defaultParentKey
  const defaultOpenKeys = pathname === '/' ? [pathname] : defaultParentKey
  const breadcrumbs = useBreadcrumbs()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const [notificationApi, notificationContextHolder] = notification.useNotification()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [modalApi, modalContextHolder] = Modal.useModal()

  const antdContextHolderValue = {
    antdMessage: messageApi,
    antdModal: modalApi,
    antdNotification: notificationApi,
  }

  const { data: isSidebarCollapsed, setData: setSidebarCollapsed } = createGlobalState<boolean>({
    queryKey: ['IS_SIDEBAR_COLLAPSED'],
    initialData: false,
  })()

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed)
  }

  const changeMenu: MenuProps['onClick'] = (e) => {
    setSelectedKeys([e.key])
  }

  useEffect(() => {
    setSelectedKeys(defaultSelectedKeys)
  }, [])

  return (
    <AntdContextHolder.Provider value={antdContextHolderValue}>
      <Layout hasSider className={styles.container}>
        <Layout.Sider
          collapsible
          collapsed={isSidebarCollapsed ?? false}
          theme="light"
          trigger={null}
          width={225}
          className={styles.sidebarMenu}
          onCollapse={toggleSidebar}
        >
          <Link href="/" className="block max-h-[73px]">
            <Flex align="center" justify="center" className="overflow-hidden">
              {isSidebarCollapsed ? (
                <div className="px-2">
                  <Image
                    src="/v4-hotel-management-portrait-logo.png"
                    alt="Hotel Logo"
                    priority
                    height={80}
                    width={80}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="px-4 py-2">
                  <Image
                    src="/v4-hotel-management-landscape-logo.png"
                    alt="Hotel Logo"
                    priority
                    height={88}
                    width={88}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                  />
                </div>
              )}
            </Flex>
          </Link>
          <Menu
            mode="inline"
            theme="light"
            defaultOpenKeys={!isSidebarCollapsed ? defaultOpenKeys : []}
            selectedKeys={selectedKeys}
            items={dashboardMenuList}
            className={styles.menuContainer}
            onClick={changeMenu}
          />
        </Layout.Sider>
        <Layout>
          <Layout.Header className={styles.headerContainer}>
            <Row gutter={16} className={styles.headerWrapper}>
              <Col>
                <Button
                  type="text"
                  icon={
                    isSidebarCollapsed ? <AiOutlineMenuUnfold fontSize="20px" /> : <AiOutlineMenuFold fontSize="20px" />
                  }
                  className={styles.sidebarToggleButton}
                  aria-label="Toggle sidebar"
                  onClick={toggleSidebar}
                />
              </Col>
              <Col flex="auto">
                <Breadcrumb items={breadcrumbs} />
              </Col>
              <Col>
                <DarkModeButton />
              </Col>
              <Col>
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      avatarBox: 'h-10 w-10',
                    },
                  }}
                />
              </Col>
            </Row>
          </Layout.Header>
          <Layout.Content className={styles.contentWrapper}>
            {messageContextHolder}
            {notificationContextHolder}
            {modalContextHolder}
            {children}
          </Layout.Content>
        </Layout>
      </Layout>
    </AntdContextHolder.Provider>
  )
}
