export type RoomStatus = {
  id: number
  status_name: string
  description?: string
  is_available: boolean
  color_code?: string
  created_at?: string
  updated_at?: string
}

export type CreateRoomStatusInput = {
  status_name: string
  description?: string
  is_available: boolean
  color_code?: string
}

export type UpdateRoomStatusInput = {
  id: number
  status_name?: string
  description?: string
  is_available?: boolean
  color_code?: string
}
