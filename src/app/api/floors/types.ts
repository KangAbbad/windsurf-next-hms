export type FloorListItem = {
  id: string
  floor_number: number
  created_at: string
  updated_at: string
}

export type CreateFloorBody = {
  floor_number: number
}

export type UpdateFloorBody = Partial<CreateFloorBody> & {
  id: string
}
