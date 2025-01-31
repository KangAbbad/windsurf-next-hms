import type { RoomStatusListItem } from './room-status'

import type { FloorListItem } from '@/app/api/floors/types'
import type { RoomClassListItem } from '@/app/api/room-classes/types'

export type RoomListItem = {
  id: string
  room_number: string
  room_class_id: string
  status_id: string
  floor_id: string
  created_at: string
  updated_at: string
  room_class: RoomClassListItem
  room_status: RoomStatusListItem
  floor: FloorListItem
}

export type CreateRoomBody = {
  room_number: string
  room_class_id: string
  status_id: string
  floor_id: string
}

export type UpdateRoomBody = Partial<CreateRoomBody> & {
  id: string
}
