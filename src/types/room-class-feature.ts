export type RoomClassFeatureListItem = {
  id: string
  room_class_id: string
  feature_id: string
  created_at: string
  updated_at: string
}

export type CreateRoomClassFeatureBody = {
  room_class_id: string
  feature_id: string
}

export type UpdateRoomClassFeatureBody = Partial<CreateRoomClassFeatureBody> & {
  id: string
}
