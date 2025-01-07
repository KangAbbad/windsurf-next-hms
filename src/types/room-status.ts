export interface RoomStatus {
  id: number
  status_name: string
  description?: string
  is_available: boolean
  color_code?: string
  created_at?: string
  updated_at?: string
}

export interface CreateRoomStatusInput {
  status_name: string
  description?: string
  is_available: boolean
  color_code?: string
}

export interface UpdateRoomStatusInput {
  id: number
  status_name?: string
  description?: string
  is_available?: boolean
  color_code?: string
}

export interface RoomStatusResponse {
  room_statuses: RoomStatus[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
