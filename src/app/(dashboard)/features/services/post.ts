import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { CreateFeatureBody, FeatureListItem } from '@/types/feature'

export const createItem = async (body: CreateFeatureBody) => {
  const { data } = await axiosInstance.post<ApiResponse<FeatureListItem>>('/features', body)
  return data
}
