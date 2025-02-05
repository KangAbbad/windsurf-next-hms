import { BedTypeListItem } from '@/app/api/bed-types/types'
import { FeatureListItem } from '@/app/api/features/types'

export type RoomClassListItem = {
  id: string
  name: string
  price: number
  image_url: string
  bed_types: {
    num_beds: number
    bed_type_id: string
    bed_type: BedTypeListItem
  }[]
  features: FeatureListItem[]
  created_at: string
  updated_at: string
}

export type CreateRoomClassBody = {
  name: string
  price: number
  image_url: string
  bed_types: {
    id: string
    num_beds: number
  }[]
  feature_ids: string[]
}

export type UpdateRoomClassBody = Partial<CreateRoomClassBody> & {
  id: string
}

export const ROOM_CLASS_NAME_MAX_LENGTH = 30
