export type RoomStatusListItem = {
  id: number
  status_name: string
  description: string
  is_available: boolean
  color_code: string
  created_at: string
  updated_at: string
}

export type CreateRoomStatusBody = {
  status_name: string
  description?: string
  is_available: boolean
  color_code?: string
}

export type UpdateRoomStatusBody = {
  id: number
  status_name?: string
  description?: string
  is_available?: boolean
  color_code?: string
}
