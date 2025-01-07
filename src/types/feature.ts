export interface Feature {
  id: number
  feature_name: string
  created_at?: string
  updated_at?: string
}

export interface CreateFeatureInput {
  feature_name: string
}

export interface UpdateFeatureInput {
  id: number
  feature_name: string
}

export interface FeatureResponse {
  features: Feature[]
  pagination: {
    total: number | null
    page: number
    limit: number
    total_pages: number | null
  }
}
