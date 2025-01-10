import type { RoomClassListItem } from './room-class'
import type { RoomStatus } from './room-status'

export type Room = {
  id: number
  room_number: string
  room_class_id: number
  room_status_id: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClassListItem[]
  room_status?: RoomStatus[]
}

export type CreateRoomInput = {
  room_number: string
  room_class_id: number
  room_status_id: number
}

export type UpdateRoomInput = {
  id: number
  room_number?: string
  room_class_id?: number
  room_status_id?: number
}
