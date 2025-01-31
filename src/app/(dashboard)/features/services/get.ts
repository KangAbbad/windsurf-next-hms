import { FeatureListItem } from '@/app/api/features/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

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
