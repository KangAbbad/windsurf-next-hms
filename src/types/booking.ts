// Shared types for booking-related endpoints
export type RoomStatusListItem = {
  id: number
  status_name: string
}

export type RoomListItem = {
  id: number
  room_number: string
  floor_id: number
  room_class_id: number
  status_id: number
  status: RoomStatusListItem
}

export type BookingListItem = {
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

export type GuestListItem = {
  id: number
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
}

export type PaymentStatusListItem = {
  id: number
  payment_status_name: string
}

export type AddonListItem = {
  id: number
  addon_name: string
  price: number
}

export type BookingRoom = {
  room: RoomListItem
}

export type BookingAddon = {
  addon: AddonListItem
}

export type BookingData = {
  id: number
  guest: GuestListItem
  payment_status: PaymentStatusListItem
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

export type CreateBookingBody = {
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
