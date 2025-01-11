import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassFeatureListItem } from '@/types/room-class-feature'

export type RoomClassFeatureListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: RoomClassFeatureListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClassFeatureListItem>>>(
    '/room-class-features',
    { params }
  )
  return data
}
