import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { AddonListItem } from '@/types/addon'

export type AddonListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: AddonListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<AddonListItem>>>('/addons', { params })
  return data
}
