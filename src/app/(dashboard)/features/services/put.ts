import { axiosInstance } from '@/services/axiosInstance'
import { FeatureListItem, UpdateFeatureBody } from '@/types/feature'

export const updateItem = async (body: UpdateFeatureBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<FeatureListItem>(`/features/${id}`, restBody)
  return data
}
