import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { FeatureListItem, UpdateFeatureBody } from '@/types/feature'

export const updateItem = async (body: UpdateFeatureBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<FeatureListItem>>(`/features/${id}`, restBody)
  return data
}
