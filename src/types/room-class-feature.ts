import type { Feature } from './feature'
import type { RoomClass } from './room-class'

export type RoomClassFeature = {
  id: number
  room_class_id: number
  feature_id: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClass[]
  feature?: Feature[]
}

export type CreateRoomClassFeatureInput = {
  room_class_id: number
  feature_id: number
}

export type UpdateRoomClassFeatureInput = {
  id: number
}

export type RoomClassFeatureResponse = {
  room_class_features: RoomClassFeature[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
