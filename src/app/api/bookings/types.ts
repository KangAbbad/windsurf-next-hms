import { GuestListItem } from '../guests/types'

import { AddonListItem } from '@/app/api/addons/types'
import { PaymentStatusListItem } from '@/app/api/payment-statuses/types'
import { RoomListItem } from '@/app/api/rooms/types'

export type BookingListItem = {
  id: string
  guest_id: string
  guest: GuestListItem
  payment_status_id: string
  payment_status: PaymentStatusListItem
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  amount: number
  rooms: RoomListItem[]
  addons: AddonListItem[]
  created_at: string
  updated_at: string
}

export type CreateBookingBody = {
  guest_id: string
  payment_status_id: string
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  amount: number
  room_ids: string[]
  addon_ids?: string[]
}

export type UpdateBookingBody = Partial<CreateBookingBody> & {
  id: string
}
