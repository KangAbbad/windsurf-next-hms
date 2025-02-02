export type AddonListItem = {
  id: string
  name: string
  price: number
  image_url: string
  created_at: string
  updated_at: string
}

export type CreateAddonBody = {
  name: string
  price: number
  image_url: string
}

export type UpdateAddonBody = Partial<CreateAddonBody> & {
  id: string
}

export const ADDON_NAME_MAX_LENGTH = 20
