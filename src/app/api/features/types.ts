export type FeatureListItem = {
  id: string
  name: string
  image_url: string
  price: number
  created_at: string
  updated_at: string
}

export type CreateFeatureBody = {
  name: string
  image_url: string
  price: number
}

export type UpdateFeatureBody = Partial<CreateFeatureBody> & {
  id: string
}

export const FEATURE_NAME_MAX_LENGTH = 200
