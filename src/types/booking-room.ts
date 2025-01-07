import type { Booking } from './booking'
import type { Room } from './room'

export interface BookingRoom {
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

export interface CreateBookingRoomInput {
  booking_id: number
  room_id: number
  check_in: string
  check_out: string
}

export interface UpdateBookingRoomInput extends Partial<CreateBookingRoomInput> {
  id: number
}

export interface BulkCreateBookingRoomInput {
  items: CreateBookingRoomInput[]
}

export interface BulkUpdateBookingRoomInput {
  items: UpdateBookingRoomInput[]
}

export interface BulkDeleteBookingRoomInput {
  ids: number[]
}

export interface BookingRoomResponse {
  booking_rooms: BookingRoom[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
