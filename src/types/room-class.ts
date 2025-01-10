import type { BedTypeListItem } from './bed-type'
import type { FeatureListItem } from './feature'

export type RoomClassFeature = {
  feature: FeatureListItem[]
}

export type RoomClassBedType = {
  bed_type: BedTypeListItem[]
  num_beds: number
}

export type RoomClass = {
  id: string
  class_name: string
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
