'use client'

import { MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { BsFillHouseAddFill } from 'react-icons/bs'
import { MdDashboard } from 'react-icons/md'

export const dashboardMenuList: MenuItemType[] = [
  {
    key: '/',
    icon: <MdDashboard />,
    label: <Link href="/">Homepage</Link>,
  },
  {
    key: '/addons',
    icon: <BsFillHouseAddFill />,
    label: <Link href="/addons">Addons</Link>,
  },
]
