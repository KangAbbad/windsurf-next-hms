import { FeatureListItem } from './feature'
import { RoomClassListItem } from './room-class'

export type RoomClassFeatureListItem = {
  room_class_id: string
  feature_id: string
  created_at: string
  updated_at: string
  room_class: RoomClassListItem
  feature: FeatureListItem
}

export type CreateRoomClassFeatureBody = {
  room_class_id: string
  feature_id: string
}

export type UpdateRoomClassFeatureBody = Partial<CreateRoomClassFeatureBody> & {
  new_room_class_id?: string
  new_feature_id?: string
}
