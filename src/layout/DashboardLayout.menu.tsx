'use client'

import { MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { LuUserRound } from 'react-icons/lu'

export const dashboardMenuList: MenuItemType[] = [
  {
    key: 'homepage',
    icon: <LuUserRound />,
    label: <Link href="/">Homepage</Link>,
  },
  {
    key: 'addons',
    icon: <LuUserRound />,
    label: <Link href="/addons">Addons</Link>,
  },
]
