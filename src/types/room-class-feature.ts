import type { Feature } from './feature'
import type { RoomClass } from './room-class'

export interface RoomClassFeature {
  id: number
  room_class_id: number
  feature_id: number
  created_at?: string
  updated_at?: string
  room_class?: RoomClass[]
  feature?: Feature[]
}

export interface CreateRoomClassFeatureInput {
  room_class_id: number
  feature_id: number
}

export interface UpdateRoomClassFeatureInput {
  id: number
}

export interface RoomClassFeatureResponse {
  room_class_features: RoomClassFeature[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
