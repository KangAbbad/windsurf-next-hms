import { AddonListItem } from './addon'
import type { BookingListItem } from './booking'

export type BookingAddon = {
  id: number
  booking_id: number
  addon_id: number
  quantity: number
  created_at?: string
  updated_at?: string
  booking?: BookingListItem[]
  addon?: AddonListItem[]
}

export type CreateBookingAddonInput = {
  booking_id: number
  addon_id: number
  quantity: number
}

export type UpdateBookingAddonInput = Partial<CreateBookingAddonInput> & {
  id: number
}

export type BulkCreateBookingAddonInput = {
  items: CreateBookingAddonInput[]
}

export type BulkUpdateBookingAddonInput = {
  items: UpdateBookingAddonInput[]
}

export type BulkDeleteBookingAddonInput = {
  ids: number[]
}
