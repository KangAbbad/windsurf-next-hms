export type BedTypeListItem = {
  id: string
  bed_type_name: string
  created_at: string
  updated_at: string
}

export type CreateBedTypeBody = {
  bed_type_name: string
}

export type UpdateBedTypeBody = Partial<CreateBedTypeBody> & {
  id: string
}
