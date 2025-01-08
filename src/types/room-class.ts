import type { BedType } from './bed-type'
import type { Feature } from './feature'

export type RoomClassFeature = {
  feature: Feature[]
}

export type RoomClassBedType = {
  bed_type: BedType[]
  quantity: number
}

export type RoomClass = {
  id: number
  room_class_name: string
  description?: string
  base_occupancy: number
  max_occupancy: number
  base_rate: number
  created_at?: string
  updated_at?: string
  features?: RoomClassFeature[]
  bed_types?: RoomClassBedType[]
}

export type CreateRoomClassInput = {
  room_class_name: string
  description?: string
  base_occupancy: number
  max_occupancy: number
  base_rate: number
  features: number[]
  bed_types: {
    bed_type_id: number
    quantity: number
  }[]
}

export type UpdateRoomClassInput = {
  id: number
  room_class_name?: string
  description?: string
  base_occupancy?: number
  max_occupancy?: number
  base_rate?: number
}

export type RoomClassResponse = {
  room_classes: RoomClass[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
