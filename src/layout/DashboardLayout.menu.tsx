'use client'

import { MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { BsFillHouseAddFill } from 'react-icons/bs'
import { MdDashboard, MdOutlineRoomPreferences } from 'react-icons/md'
import { PiStairsDuotone } from 'react-icons/pi'
import { RiHotelBedFill } from 'react-icons/ri'
import { TbBed, TbListDetails } from 'react-icons/tb'

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
    icon: <RiHotelBedFill />,
    label: <Link href="/room-class-bed-types">Room Class Bed Types</Link>,
  },
  {
    key: '/room-classes',
    icon: <RiHotelBedFill />,
    label: <Link href="/room-classes">Room Classes</Link>,
  },
  {
    key: '/room-class-features',
    icon: <MdOutlineRoomPreferences />,
    label: <Link href="/room-class-features">Room Class Features</Link>,
  },
]
