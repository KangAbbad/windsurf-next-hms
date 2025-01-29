'use client'

import { MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { BsFillHouseAddFill } from 'react-icons/bs'
import { MdDashboard } from 'react-icons/md'
import { PiStairsDuotone } from 'react-icons/pi'
import { RiHotelBedFill } from 'react-icons/ri'
import { TbBed, TbCalendarPin, TbCreditCard, TbListDetails, TbStatusChange, TbUsers } from 'react-icons/tb'

export const dashboardMenuList: MenuItemType[] = [
  {
    key: '/',
    icon: <MdDashboard />,
    label: <Link href="/">Dashboard</Link>,
  },
  {
    key: '/guests',
    icon: <TbUsers />,
    label: <Link href="/guests">Guests</Link>,
  },
  {
    key: '/bookings',
    icon: <TbCalendarPin />,
    label: <Link href="/bookings">Bookings</Link>,
  },
  {
    key: '/rooms',
    icon: <RiHotelBedFill />,
    label: <Link href="/rooms">Rooms</Link>,
  },
  {
    key: '/room-classes',
    icon: <RiHotelBedFill />,
    label: <Link href="/room-classes">Room Classes</Link>,
  },
  {
    key: '/room-statuses',
    icon: <TbStatusChange />,
    label: <Link href="/room-statuses">Room Statuses</Link>,
  },
  {
    key: '/payment-statuses',
    icon: <TbCreditCard />,
    label: <Link href="/payment-statuses">Payment Statuses</Link>,
  },
  {
    key: '/addons',
    icon: <BsFillHouseAddFill />,
    label: <Link href="/addons">Addons</Link>,
  },
  {
    key: '/features',
    icon: <TbListDetails />,
    label: <Link href="/features">Features</Link>,
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
]
