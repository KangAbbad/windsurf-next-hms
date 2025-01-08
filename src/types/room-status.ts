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

export type RoomStatusResponse = {
  room_statuses: RoomStatus[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
