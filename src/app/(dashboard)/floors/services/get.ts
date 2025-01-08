import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { FloorListItem } from '@/types/floor'

export type FloorListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: FloorListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<FloorListItem>>>('/floors', { params })
  return data
}
