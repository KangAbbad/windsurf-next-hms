import type { BedType } from './bed-type'
import type { Feature } from './feature'

export interface RoomClassFeature {
  feature: Feature[]
}

export interface RoomClassBedType {
  bed_type: BedType[]
  quantity: number
}

export interface RoomClass {
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

export interface CreateRoomClassInput {
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

export interface UpdateRoomClassInput {
  id: number
  room_class_name?: string
  description?: string
  base_occupancy?: number
  max_occupancy?: number
  base_rate?: number
}

export interface RoomClassResponse {
  room_classes: RoomClass[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
