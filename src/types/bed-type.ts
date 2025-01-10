export type BedTypeListItem = {
  id: string
  bed_type_name: string
  created_at: string
  updated_at: string
}

export type CreateBedTypeBody = {
  bed_type_name: string
}

export type UpdateBedTypeBody = {
  id: string
  bed_type_name: string
}

export const BED_TYPE_NAME_MAX_LENGTH = 50
