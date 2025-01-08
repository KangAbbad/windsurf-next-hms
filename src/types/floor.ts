export type Floor = {
  id: number
  floor_number: number
  created_at?: string
  updated_at?: string
}

export type CreateFloorInput = {
  floor_number: number
}

export type FloorResponse = {
  floors: Floor[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
