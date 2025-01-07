import type { RoomClass } from './room-class'
import type { RoomStatus } from './room-status'

export interface Room {
  id: number
  room_number: string
  room_class_id: number
  room_status_id: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClass[]
  room_status?: RoomStatus[]
}

export interface CreateRoomInput {
  room_number: string
  room_class_id: number
  room_status_id: number
}

export interface UpdateRoomInput {
  id: number
  room_number?: string
  room_class_id?: number
  room_status_id?: number
}

export interface RoomResponse {
  rooms: Room[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
