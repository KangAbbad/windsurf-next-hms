import { CreateFeatureBody, FeatureListItem } from '@/app/api/features/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateFeatureBody) => {
  const { data } = await axiosInstance.post<ApiResponse<FeatureListItem>>('/features', body)
  return data
}
