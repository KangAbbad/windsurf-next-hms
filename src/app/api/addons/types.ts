export type AddonListItem = {
  id: string
  addon_name: string
  price: number
  created_at: string
  updated_at: string
}

export type CreateAddonBody = {
  addon_name: string
  price: number
}

export type UpdateAddonBody = Partial<CreateAddonBody> & {
  id: string
}
