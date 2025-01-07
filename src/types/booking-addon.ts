import type { Addon } from './addon'
import type { Booking } from './booking'

export interface BookingAddon {
  id: number
  booking_id: number
  addon_id: number
  quantity: number
  created_at?: string
  updated_at?: string
  booking?: Booking[]
  addon?: Addon[]
}

export interface CreateBookingAddonInput {
  booking_id: number
  addon_id: number
  quantity: number
}

export interface UpdateBookingAddonInput extends Partial<CreateBookingAddonInput> {
  id: number
}

export interface BulkCreateBookingAddonInput {
  items: CreateBookingAddonInput[]
}

export interface BulkUpdateBookingAddonInput {
  items: UpdateBookingAddonInput[]
}

export interface BulkDeleteBookingAddonInput {
  ids: number[]
}

export interface BookingAddonResponse {
  booking_addons: BookingAddon[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
