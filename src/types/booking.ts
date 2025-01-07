// Shared types for booking-related endpoints
export interface RoomStatus {
  id: number
  status_name: string
}

export interface Room {
  id: number
  room_number: string
  floor_id: number
  room_class_id: number
  status_id: number
  status: RoomStatus
}

export interface Booking {
  id: number
  guest_id: number
  payment_status_id: number
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  booking_amount: number
  created_at: string
  updated_at: string
}

export interface Guest {
  id: number
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
}

export interface PaymentStatus {
  id: number
  payment_status_name: string
}

export interface Addon {
  id: number
  addon_name: string
  price: number
}

export interface BookingRoom {
  room: Room
}

export interface BookingAddon {
  addon: Addon
}

export interface BookingData {
  id: number
  guest: Guest
  payment_status: PaymentStatus
  rooms: BookingRoom[]
  addons: BookingAddon[]
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  booking_amount: number
  created_at: string
  updated_at: string
}

export interface CreateBookingInput {
  guest_id: number
  payment_status_id: number
  room_ids: number[]
  addon_ids?: number[]
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children?: number
  booking_amount: number
}
