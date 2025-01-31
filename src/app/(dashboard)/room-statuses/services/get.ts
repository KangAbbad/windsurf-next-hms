import type { RoomStatusListItem } from '@/app/api/room-statuses/types'
import type { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type RoomStatusListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: RoomStatusListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomStatusListItem>>>('/room-statuses', {
    params,
  })
  return data
}
