import type { RoomClass } from './room-class'

export interface Addon {
  id: number
  addon_name: string
  description?: string
  price: number
  created_at?: string
  updated_at?: string
  room_classes?: {
    room_class: RoomClass[]
  }[]
}

export interface CreateAddonInput {
  addon_name: string
  description?: string
  price: number
}

export interface UpdateAddonInput extends Partial<CreateAddonInput> {
  id: number
}

export interface AddonResponse {
  addons: Addon[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
