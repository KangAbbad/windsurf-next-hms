import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { FeatureListItem } from '@/types/feature'

export type FeatureListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: FeatureListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<FeatureListItem>>>('/features', {
    params,
  })
  return data
}
