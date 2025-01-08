import type { Booking } from './booking'
import type { Room } from './room'

export type BookingRoom = {
  id: number
  booking_id: number
  room_id: number
  check_in: string
  check_out: string
  created_at?: string
  updated_at?: string
  booking?: Booking[]
  room?: Room[]
}

export type CreateBookingRoomInput = {
  booking_id: number
  room_id: number
  check_in: string
  check_out: string
}

export type UpdateBookingRoomInput = Partial<CreateBookingRoomInput> & {
  id: number
}

export type BulkCreateBookingRoomInput = {
  items: CreateBookingRoomInput[]
}

export type BulkUpdateBookingRoomInput = {
  items: UpdateBookingRoomInput[]
}

export type BulkDeleteBookingRoomInput = {
  ids: number[]
}

export type BookingRoomResponse = {
  booking_rooms: BookingRoom[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
