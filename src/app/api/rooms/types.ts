import type { FloorListItem } from '@/app/api/floors/types'
import type { RoomClassListItem } from '@/app/api/room-classes/types'
import type { RoomStatusListItem } from '@/app/api/room-statuses/types'

export type RoomListItem = {
  id: string
  number: number
  floor_id: string
  floor: FloorListItem
  room_class_id: string
  room_class: RoomClassListItem
  room_status_id: string
  room_status: RoomStatusListItem
  created_at: string
  updated_at: string
}

export type CreateRoomBody = {
  number: number
  floor_id: string
  room_class_id: string
  room_status_id: string
}

export type UpdateRoomBody = Partial<CreateRoomBody> & {
  id: string
}
