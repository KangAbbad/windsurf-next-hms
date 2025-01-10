import type { BedTypeListItem } from './bed-type'
import type { RoomClassListItem } from './room-class'

export type RoomClassBedTypeListItem = {
  room_class_id: string
  bed_type_id: string
  num_beds: number
  created_at: string
  updated_at: string
  room_class?: RoomClassListItem
  bed_type?: BedTypeListItem
}

export type CreateRoomClassBedTypeBody = {
  room_class_id: string
  bed_type_id: string
  num_beds: number
}

export type UpdateRoomClassBedTypeBody = {
  room_class_id: string
  bed_type_id: string
  num_beds: number
}
