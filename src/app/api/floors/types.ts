export type FloorListItem = {
  id: string
  number: number
  name: string | null
  created_at: string
  updated_at: string
}

export type CreateFloorBody = {
  number: number
  name?: string
}

export type UpdateFloorBody = Partial<CreateFloorBody> & {
  id: string
}

export const FLOOR_NAME_MAX_LENGTH = 20
