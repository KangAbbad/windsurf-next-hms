import { BedTypeListItem } from './bed-type'
import { FeatureListItem } from './feature'

export type RoomClassListItem = {
  id: string
  class_name: string
  base_price: number
  created_at: string
  updated_at: string
  bed_types: {
    num_beds: number
    bed_type: BedTypeListItem
  }[]
  features: FeatureListItem[]
}

export type CreateRoomClassBody = {
  class_name: string
  base_price: number
  bed_types: {
    num_beds: number
    bed_type_id: string
  }[]
  feature_ids: string[]
}

export type UpdateRoomClassBody = Partial<CreateRoomClassBody> & {
  id: string
}
