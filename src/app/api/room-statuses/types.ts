export type RoomStatusListItem = {
  id: number
  status_name: string
  status_number: number
  created_at: string
  updated_at: string
}

export type CreateRoomStatusBody = {
  status_name: string
  status_number: number
}

export type UpdateRoomStatusBody = Partial<CreateRoomStatusBody> & {
  id: number
}
