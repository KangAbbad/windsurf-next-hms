import type { AddonListItem } from './addon'
import { GuestListItem } from './guest'
import { PaymentStatusListItem } from './payment-status'
import type { RoomListItem } from './room'

export type BookingListItem = {
  id: string
  guest: GuestListItem
  payment_status: PaymentStatusListItem
  rooms: RoomListItem[]
  addons: AddonListItem[]
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  booking_amount: number
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
  booking_amount: number
  room_ids: string[]
  addon_ids?: string[]
}

export type UpdateBookingBody = Partial<CreateBookingBody> & {
  id: string
}
