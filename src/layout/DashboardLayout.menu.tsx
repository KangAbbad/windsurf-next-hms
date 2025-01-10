'use client'

import { MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { BsFillHouseAddFill } from 'react-icons/bs'
import { MdDashboard } from 'react-icons/md'
import { PiStairsDuotone } from 'react-icons/pi'
import { TbBed, TbListDetails, TbBedFilled } from 'react-icons/tb'

export const dashboardMenuList: MenuItemType[] = [
  {
    key: '/dashboard',
    icon: <MdDashboard />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: '/addons',
    icon: <BsFillHouseAddFill />,
    label: <Link href="/addons">Addons</Link>,
  },
  {
    key: '/floors',
    icon: <PiStairsDuotone />,
    label: <Link href="/floors">Floors</Link>,
  },
  {
    key: '/bed-types',
    icon: <TbBed />,
    label: <Link href="/bed-types">Bed Types</Link>,
  },
  {
    key: '/features',
    icon: <TbListDetails />,
    label: <Link href="/features">Features</Link>,
  },
  {
    key: '/room-class-bed-types',
    icon: <TbBedFilled />,
    label: <Link href="/room-class-bed-types">Room Class Bed Types</Link>,
  },
]
