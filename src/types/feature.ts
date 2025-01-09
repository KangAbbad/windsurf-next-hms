export type FeatureListItem = {
  id: string
  feature_name: string
  created_at: string
  updated_at: string
}

export type CreateFeatureBody = {
  feature_name: string
}

export type UpdateFeatureBody = {
  id: string
  feature_name: string
}

export const FEATURE_NAME_MAX_LENGTH = 200
