export type BedTypeListItem = {
  id: string
  name: string
  height: number
  width: number
  length: number
  material: string
  image_url: string
  created_at: string
  updated_at: string
}

export type CreateBedTypeBody = {
  image_url: string
  name: string
  length: number
  width: number
  height: number
  material: string
}

export type UpdateBedTypeBody = Partial<CreateBedTypeBody> & {
  id: string
}

export const BED_TYPE_NAME_MAX_LENGTH = 50
