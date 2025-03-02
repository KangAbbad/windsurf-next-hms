import { FloorListItem } from '@/app/api/floors/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type FloorListPageParams = {
  page?: number
  limit?: number
  search?: {
    name?: string
    number?: number
  }
}

export const getAll = async (params: FloorListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<FloorListItem>>>('/floors', { params })
  return data
}
