export interface AddonListItem {
  id: string
  addon_name: string
  price: number
  created_at: string
  updated_at: string
}

export interface CreateAddonBody {
  addon_name: string
  price: number
}

export interface UpdateAddonBody extends Partial<CreateAddonBody> {
  id: string
}
