import type { RoomClassListItem } from './room-class'
import type { RoomStatusListItem } from './room-status'

export type RoomListItem = {
  id: string
  room_number: string
  room_class_id: string
  room_status_id: string
  created_at: string
  updated_at: string
  room_class: RoomClassListItem[]
  room_status: RoomStatusListItem[]
}

export type CreateRoomBody = {
  room_number: string
  room_class_id: string
  room_status_id: string
}

export type UpdateRoomBody = Partial<CreateRoomBody> & {
  id: string
}
