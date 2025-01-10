import type { BedTypeListItem } from './bed-type'
import type { FeatureListItem } from './feature'

export type RoomClassFeatureListItem = {
  feature: FeatureListItem[]
}

export type RoomClassBedTypeListItem = {
  bed_type: BedTypeListItem[]
  quantity: number
}

export type RoomClassListItem = {
  id: string
  class_name: string
  base_price: number
  features?: RoomClassFeatureListItem[]
  bed_types?: RoomClassBedTypeListItem[]
  created_at?: string
  updated_at?: string
}

export type CreateRoomClassBody = {
  class_name: string
  base_price: number
  features: number[]
  bed_types: {
    bed_type_id: number
    quantity: number
  }[]
}

export type UpdateRoomClassBody = Partial<CreateRoomClassBody> & {
  id: string
}
