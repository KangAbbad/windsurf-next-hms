export type RoomClassListItem = {
  id: string
  class_name: string
  base_price: number
  created_at: string
  updated_at: string
}

export type CreateRoomClassBody = {
  class_name: string
  base_price: number
}

export type UpdateRoomClassBody = Partial<CreateRoomClassBody> & {
  id: string
}
