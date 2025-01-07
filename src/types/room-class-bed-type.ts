import type { BedType } from './bed-type'
import type { RoomClass } from './room-class'

export interface RoomClassBedType {
  id: number
  room_class_id: number
  bed_type_id: number
  quantity: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClass
  bed_type?: BedType
}

export interface CreateRoomClassBedTypeInput {
  room_class_id: number
  bed_type_id: number
  quantity: number
}

export interface UpdateRoomClassBedTypeInput {
  id: number
  quantity: number
}

export interface RoomClassBedTypeResponse {
  room_class_bed_types: RoomClassBedType[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
