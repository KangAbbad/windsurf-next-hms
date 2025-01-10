import type { FeatureListItem } from './feature'
import type { RoomClass } from './room-class'

export type RoomClassFeature = {
  id: number
  room_class_id: number
  feature_id: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClass[]
  feature?: FeatureListItem[]
}

export type CreateRoomClassFeatureInput = {
  room_class_id: number
  feature_id: number
}

export type UpdateRoomClassFeatureInput = {
  id: number
}
