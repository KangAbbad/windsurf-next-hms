export type RoomClassFeatureListItem = {
  id: string
  room_class_id: string
  feature_id: string
  created_at?: string
  updated_at?: string
}

export type CreateRoomClassFeatureInput = {
  room_class_id: string
  feature_id: string
}

export type UpdateRoomClassFeatureInput = {
  id: string
}
