import { LogListItem } from '@/app/api/logs/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type LogListPageParams = {
  page?: number
  limit?: number
  search?: {
    action_type?: string
    resource_type?: string
  }
}

export const getAll = async (params: LogListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<LogListItem>>>('/logs', { params })
  return data
}
