import { FeatureListItem, UpdateFeatureBody } from '@/app/api/features/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateFeatureBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<FeatureListItem>>(`/features/${id}`, restBody)
  return data
}
