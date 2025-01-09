import type { BedTypeListItem } from './bedType'
import type { RoomClass } from './room-class'

export type RoomClassBedTypeListItem = {
  id: string
  room_class_id: string
  bed_type_id: string
  quantity: number
  created_at: string
  updated_at: string
  room_class?: RoomClass
  bed_type?: BedTypeListItem
}

export type CreateRoomClassBedTypeBody = {
  room_class_id: string
  bed_type_id: string
  quantity: number
}

export type UpdateRoomClassBedTypeBody = {
  id: string
  room_class_id: string
  bed_type_id: string
  quantity: number
}
