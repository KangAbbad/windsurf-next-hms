export interface Floor {
  id: number
  floor_number: number
  created_at?: string
  updated_at?: string
}

export interface CreateFloorInput {
  floor_number: number
}

export interface FloorResponse {
  floors: Floor[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
