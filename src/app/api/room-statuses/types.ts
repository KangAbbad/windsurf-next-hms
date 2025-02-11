export type RoomStatusListItem = {
  id: string
  name: string
  number: number
  color: string
  created_at: string
  updated_at: string
}

export type CreateRoomStatusBody = {
  name: string
  number: number
  color: string
}

export type UpdateRoomStatusBody = Partial<CreateRoomStatusBody> & {
  id: string
}
