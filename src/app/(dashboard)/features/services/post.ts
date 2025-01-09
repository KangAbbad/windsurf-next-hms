import { axiosInstance } from '@/services/axiosInstance'
import { CreateFeatureBody, FeatureListItem } from '@/types/feature'

export const createItem = async (body: CreateFeatureBody) => {
  const { data } = await axiosInstance.post<FeatureListItem>('/features', body)
  return data
}
