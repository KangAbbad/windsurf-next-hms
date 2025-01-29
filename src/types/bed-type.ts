export type BedTypeListItem = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type CreateBedTypeBody = {
  name: string
}

export type UpdateBedTypeBody = {
  id: string
  name: string
}

export const BED_TYPE_NAME_MAX_LENGTH = 50
