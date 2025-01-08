export type Feature = {
  id: number
  feature_name: string
  created_at?: string
  updated_at?: string
}

export type CreateFeatureInput = {
  feature_name: string
}

export type UpdateFeatureInput = {
  id: number
  feature_name: string
}

export type FeatureResponse = {
  features: Feature[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
