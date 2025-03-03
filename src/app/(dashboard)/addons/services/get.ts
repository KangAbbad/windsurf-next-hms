import { AddonListItem } from '@/app/api/addons/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type AddonListPageParams = {
  page?: number
  limit?: number
  search?: {
    name?: string
    price?: string
  }
}

export const getAll = async (params: AddonListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<AddonListItem>>>('/addons', { params })
  return data
}
